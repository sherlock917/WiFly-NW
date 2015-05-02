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
  var dir = exec('./extensions/DirectoryChooser.app/Contents/MacOS/DirectoryChooser', {encoding : 'utf-8'})
  console.log(dir)
  if (dir == '') {
    res.writeHead(500);
    res.end();
  } else {
    var form = new formidable.IncomingForm()
    form.encoding = 'utf-8'
    form.uploadDir = dir
    form.keepExtensions = true
    form.parse(req, function(err, fields, files) {
      if (err) {
        res.writeHead(500)
      } else {
        res.writeHead(200)
      }
      res.end()
    })
  }
}