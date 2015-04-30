(function () {

  var request = require('request'),
      interfaces = require('os').networkInterfaces();

  var server = require('../controllers/server'),
      storage = require('../controllers/storage');

  var peers = {};
  var prefix = '', suffix = 1, selfSuffix = 0;

  window.onload = function () {
    Page.init();
    Core.init();
  }

  function sizeOf (obj) {
    var size = 0;
    for (var i in obj) {
      if (obj.hasOwnProperty(i)) {
        size++;
      }
    }
    return size;
  }

  var Page = {
    init : function () {
      this.initViews();
      this.initEvents();
    },
    initViews : function () {
      $('#nav-user').text(storage.getLocalStorage('name'));
    },
    initEvents : function () {
      $('.nav-item').on('click', this.switchSection);
    },
    switchSection : function () {
      Page.switchMain(this);
      Page.switchNav(this);
    },
    switchNav : function (nav) {
      if (!$(nav).hasClass('nav-item-current')) {
        var target = $(nav).attr('id').split('-').pop();
        $('.nav-item-current').removeClass('nav-item-current');
        $(nav).addClass('nav-item-current');
      }
    },
    switchMain : function (nav) {
      var current = $('.nav-item-current').attr('id').split('-').pop();
      var target = $(nav).attr('id').split('-').pop();
      var currentDom = $('#section-' + current);
      var targetDom = $('#section-' + target);
      if (target == 'devices' && sizeOf(peers) <= 0) {
        this.showProgress('Searching For Devices...');
      } else {
        this.hideProgress();
      }
      targetDom.show();
      if (currentDom.attr('index') < targetDom.attr('index')) {
        currentDom.addClass('section-popBig');
        targetDom.addClass('section-popSmall');
      } else {
        currentDom.addClass('section-shrinkSmall');
        targetDom.addClass('section-shrinkBig');
      }
      setTimeout(function () {
        currentDom.hide();
        $('.section').removeClass('section-popBig section-popSmall section-shrinkBig section-shrinkSmall');
      }, 2000);
    },
    showProgress : function (hint) {
      if ($('#nav-item-devices').hasClass('nav-item-current')) {
        $('#progress')
        .css({
          'opacity' : 1,
          'z-index' : 1000
        })
        .find('h3')
        .text(hint ? hint : 'Loading...');
      }
    },
    hideProgress : function () {
      $('#progress').css({
        'opacity' : 0,
        'z-index' : 1
      });
    },
    addDevice : function (num) {
      var data = peers[num];
      var dom = $(Template['device-item']);
      dom.attr('id', 'device-' + num);
      dom.find('.device-icon').attr('src', '../public/img/' + data.type + '.png');
      dom.find('.device-name').text(data.name);
      dom.find('.device-ip').text(data.url.substring(7, data.url.indexOf(':12580')));
      dom.appendTo('#device-list');
      Page.hideProgress();
    },
    removeDevice : function (num) {
      delete peers[num];
      $('#device-' + num).remove();
      if (sizeOf(peers) <= 0) {
        Page.showProgress('Searching For Devices...');
      }
    },
    updateProgress : function (target, percentage) {
      $('#device-' + target)
      .find('.device-progress-inner')
      .css('width', 200 * (percentage / 100) + 'px');
      $('#device-' + target)
      .find('.device-percentage')
      .text(percentage + '%');
    }
  };

  var Core = {
    init : function () {
      this.initServer();
      this.getIp();
    },
    initServer : function () {
      if (!storage.getLocalStorage('name')) {
        storage.setLocalStorage('name', prompt('Enter A Name For Your Device'));
      }
      server.start();
      this.searchDevice();
    },
    getIp : function () {
      for(var dev in interfaces){  
        var face = interfaces[dev];
        for (var i = 0; i < face.length; i++) {  
          var info = face[i];
          if (!info.internal && info.family === 'IPv4' && info.address !== '127.0.0.1') {
            prefix = info.address.substring(0, info.address.lastIndexOf('.') + 1);
            selfPrefix = parseInt(info.address.substring(info.address.lastIndexOf('.') + 1, info.address.length));
          }  
        }  
      }
    },
    searchDevice : function () {
      if (sizeOf(peers) <= 0) {
        Page.showProgress('Searching For Devices...');
      }
      var self = this;
      if (suffix >= 255) {
        suffix = 1;
      }
      for (var i = 0; i < 30; i++) {
        (function () {
          var num = suffix + i;
          request({
            method : 'GET',
            uri : 'http://' + prefix + num + ':12580/id',
            timeout : 3000
          }, function (err, res, body) {
            if (!err && res.statusCode == 200 && num != selfPrefix && !peers[num]) {
              peers[num] = JSON.parse(body);
              Page.addDevice(num);
            } else if (peers[num] && err) {
              Page.removeDevice(num);
            }
          });
        })();
      }
      setTimeout(function () {
        suffix += 30;
        self.searchDevice();
      }, 3000);
    }
  };

})();