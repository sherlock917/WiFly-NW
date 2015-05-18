var fs = require('fs')
  , exec = require('child_process').execSync
  , formidable = require('formidable')

var storage = require('./storage')
  , server = require('./server')

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