exports.start = function () {
  var storage = require('./storage')
  var express = require('express')
  var app = express()
  app.use(require('body-parser').json())
  app.get('/id', function (req, res) {
    res.writeHead(200, {'Content-Type' : 'application/json'})
    res.end(JSON.stringify({
      name : storage.getLocalStorage('name'),
      url : exports.getBaseUrl() + '/',
      type : 'mac'
    }))
  })
  app.listen(12580)
}

exports.getHostIp = function () {
  var interfaces = require('os').networkInterfaces()
  for(var dev in interfaces){  
    var face = interfaces[dev]
    for (var i = 0; i < face.length; i++) {  
      var info = face[i]
      if (!info.internal && info.family === 'IPv4' && info.address !== '127.0.0.1') {
        return info.address
      }  
    }  
  }
}

exports.getBaseUrl = function () {
  return 'http://' + exports.getHostIp() + ':12580'
}