// var request = require('request')
//   , interfaces = require('os').networkInterfaces()

var ip = (function () {
  for(var dev in interfaces){  
    var face = interfaces[dev]
    for (var i = 0; i < face.length; i++) {  
      var info = face[i]
      if (!info.internal && info.family === 'IPv4' && info.address !== '127.0.0.1') {
        return info.address
      }  
    }  
  }
})()

var prefix = ip.substring(0, ip.lastIndexOf('.') + 1)
var suffix = 1

// var peers  = {}

// function requestNext () {
  // if (suffix >= 255) {
  //   suffix = 1
  // }
  // for (var i = 0; i < 30; i++) {
  //   (function () {
  //     var num = suffix + i
  //     request({
  //       method : 'GET',
  //       uri : 'http://' + prefix + num + ':12580/id',
  //       timeout : 3000
  //     }, function (err, res, body) {
  //       if (!err && res.statusCode == 200) {
  //         peers[num] = JSON.parse(body)
  //       } else {
  //         delete peers[num]
  //       }
  //     })
  //   })() 
  // }
  // setTimeout(function () {
  //   suffix += 30
  //   console.log(peers)
  //   requestNext(suffix)
  // }, 3000)
// }

// requestNext()

var exec = require('child_process').exec

exec('./DirectoryChooser.app/Contents/MacOS/DirectoryChooser', function (err, stdout, stderr) {
  if (stdout) {
    console.log(stdout)
  }
})