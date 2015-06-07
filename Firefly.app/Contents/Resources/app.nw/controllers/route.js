var fs = require('fs')
  , url = require('url')
  , exec = require('child_process').execSync
  , asyexec = require('child_process').exec
  , request = require('request')
  , formidable = require('formidable')

var storage = require('./storage')
  , server = require('./server')
  , slicer = require('./slicer')

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
      res.write((bytesReceived / bytesExpected * 100 ).toFixed(0))
    })
    form.parse(req, function(err, fields, files) {
      if (err) {
        res.statusCode = 500
      } else {
        var path = dir + '/' + files.file.name
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
      window.Interface.refresh();
    })
  }
}

exports.uploadHead=function(req,res){
  console.log("route::upload_head");
  var dirSet = storage.getLocalStorage('dirSet');
  var dir = storage.getLocalStorage('dir');
  if (dirSet == 'ask' || !dir) {
    dir = exec('./extensions/DirectoryChooser.app/Contents/MacOS/DirectoryChooser', {encoding : 'utf-8'})
  }
  if (dir == '') {
    res.writeHead(500);
    res.end();
  } else {
    var file_name = req.body.file_name,
        file_size = req.body.file_size,
        file_md5 = req.body.file_md5;
    var chunk_size = slicer.getFitableChunkSize(file_size);
    
    slicer.setTotalChunk(file_md5, slicer.getChunkNumFromSize(file_size, chunk_size));
    slicer.setSavPath(file_md5, dir);
    slicer.setSavName(file_md5, file_name);
    slicer.setSavSize(file_md5, file_size);

    var hidenpath=dir+'/.'+file_name;
    if(!fs.existsSync(hidenpath))
      fs.mkdirSync(hidenpath)

    res.writeHead(200);
    res.end();
  }
}

exports.uploadChunk = function(req,res){
  var file_md5 = req.headers.file_md5;
  var file_size = slicer.getSavSize(file_md5);
  var file_foreSize = parseInt(req.headers.file_foresize);
  var chunk_size = slicer.getFitableChunkSize(file_size);
  var chunk_md5 = req.headers.chunk_md5;
  var chunk_tmpPath = '../temp/';
  if(!fs.existsSync(chunk_tmpPath))
      fs.mkdirSync(chunk_tmpPath)

  console.log(req.headers);

  var form = new formidable.IncomingForm();
  form.encoding = 'utf-8'
  form.uploadDir = chunk_tmpPath;
  form.keepExtensions = true
  form.on('progress', function (bytesReceived, bytesExpected) {
    console.log(((file_foreSize + bytesReceived )/ file_size * 100).toFixed(0));
    res.write(((file_foreSize + bytesReceived )/ file_size * 100).toFixed(0));
  })
  form.parse(req, function(err, fields, files) {
    console.log(files.file.name)
    if (err) {
      res.statusCode = 500;
      res.end();
    } else {
      var file_suffix = files.file.name.split('.').pop();
      var file_chunkN = parseInt(file_suffix);
      var file_prefixname = files.file.name.substring(0, files.file.name.length - file_suffix.length-1)
      var file_chunkTot = slicer.getTotalChunk(file_md5);
      var file_path = slicer.getSavPath(file_md5);

      var path = file_path + '/.' + file_prefixname + '/' + files.file.name;
      fs.renameSync(files.file.path, path);

      slicer.getMD5fromFile(path,function(local_chunk_md5){
        if(local_chunk_md5 != chunk_md5){
          console.log("route::uploadchunk:chunk_md5 discomformit");
          console.log("chunk_md5:"+chunk_md5);
          console.log("local_chunk_md5:"+local_chunk_md5);
          res.statusCode = 500;
          res.end();
        }
        else{
          if(file_chunkN + 1 == file_chunkTot){
            slicer.merge(file_path, file_prefixname, file_chunkTot);
            exec('rm -rf '+file_path+'/.'+file_prefixname,function(err,out) { 
			  if(err)
			  	console.log(err); 
			});
            storage.addReceived({
              path : file_path+'/'+file_prefixname,
              name : file_prefixname,
              size : files.file.size + (file_chunkTot - 1) * chunk_size,
              type : files.file.type,
              from : files.file.from,
              time : (new Date()).getTime()
            });
          }
          res.statusCode = 200;
          res.end();
          window.Interface.refresh();
        }
      });
    }
  });
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