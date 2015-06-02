var fs = require('fs')
  , url = require('url')
  , exec = require('child_process').execSync
  , request = require('request')
  , formidable = require('formidable')

var storage = require('./storage')
  , server = require('./server')
  , slicer = require('./slicer')

var tmpdir
var blockSz=1024

exports.index = function (req, res) {
  fs.readFile('./public/html/index.html', function (err, data) {
    if (err) {
      res.writeHead(500)
      res.end()
    } else {
      res.writeHead(200, {'Content-Type' : 'text/html'})
      res.end(data)
    }
  })
}

exports.id = function (req, res) {
  res.writeHead(200, {'Content-Type' : 'application/json'})
  res.end(JSON.stringify({
    name : storage.getLocalStorage('name'),
    url : server.getBaseUrl(),
    type : 'mac'
  }))
}

exports.upload = function (req, res) {
  var form = new formidable.IncomingForm()
  form.encoding = 'utf-8'
  form.uploadDir = '../../../../'
  form.keepExtensions = true
  form.on('progress', function (bytesReceived, bytesExpected) {
    res.write(((bytesReceived+blockN*blockSz) / (blockTot* blockSz )* 100 ).toFixed(0))
  })
  form.parse(req, function(err, fields, files) {
    console.log(files.file.name)
    if (err) {
      res.statusCode = 500
    } else {
      var suffix=files.file.name.split('.').pop();
      var blockN=parseInt(suffix)
      var prefixname=files.file.name.substring(0,files.file.name.length-suffix.length-1)
      var blockTot=slicer.getBlockSize(storage.getLocalStorage('file_'+prefixname) + '/.' + prefixname + '/' + prefixname +'.download');
      var lpath=storage.getLocalStorage('file_'+prefixname);
      if(lpath==null||lpath==undefined)
        lpath=tmpdir
      var path = lpath + '/.' + prefixname + '/' + files.file.name
      fs.renameSync(files.file.path, path)
      storage.addReceived({
        path : path,
        name : files.file.name,
        size : files.file.size,
        type : files.file.type,
        from : files.file.from,
        time : (new Date()).getTime()
      })
      if(blockN+1==blockTot){
        slicer.merge(lpath,prefixname)
        console.log("file merged")
      }
      res.statusCode = 200
    }
    res.end()
    window.Interface.refresh();
  })
}

exports.uploadHead=function(req,res){
  var dirSet = storage.getLocalStorage('dirSet');
  var dir = storage.getLocalStorage('dir');
  if (dirSet == 'ask' || !dir) {
    dir = exec('./extensions/DirectoryChooser.app/Contents/MacOS/DirectoryChooser', {encoding : 'utf-8'})
  }
  if (dir == '') {
    res.writeHead(500);
    res.end();
  } else {
    var form = new formidable.IncomingForm()
    form.encoding = 'utf-8'
    form.uploadDir = dir
    form.keepExtensions = true
    form.on('progress', function (bytesReceived, bytesExpected) {
      res.write((0.0).toFixed(0))
    })
    form.parse(req, function(err, fields, files) {
      if (err) {
        res.statusCode = 500
      } else {
        var name=files.file.name.replace('.download','');
        var hidenpath=dir+'/.'+name
        storage.setLocalStorage('file_'+name,dir)
        tmpdir=dir;
        console.log('file_'+name)
        if(!fs.existsSync(hidenpath))
           fs.mkdirSync(hidenpath)
        var path = hidenpath+'/'+name+'.download';
        console.log(name+','+hidenpath+','+path)
        fs.renameSync(files.file.path, path)
        storage.addReceived({
          path : path,
          name : files.file.name,
          size : files.file.size,
          type : files.file.type,
          from : files.file.from,
          time : (new Date()).getTime()
        })
        res.statusCode = 200
      }
      res.end()
      console.log('headsuccessful')
      window.Interface.refresh();
    })
  }
}

exports.chat = function (req, res) {
  var query = url.parse('http://0.0.0.0' + req.url, true).query
  var reply = window.prompt(query.from + ':\n' + query.content)
  if (reply && reply.length > 0) {
    var from = 'from=' + storage.getLocalStorage('name')
    var content = 'content=' + reply
    var replyUrl = 'url=' + server.getBaseUrl() + 'chat'
    request(window.encodeURI(query.url + '?' + from + '&' + content + '&' + replyUrl))
  }
}