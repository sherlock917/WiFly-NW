(function () {

  window.onload = function () {
    eventsHandler();
  }

  function eventsHandler () {
    $('#submit').on('click', showFiles);
    $('#file').on('change', startUpload);
  }

  function showFiles () {
    $('#file').click();
  }

  function startUpload (e) {
    var file = e.target.files[0];
    toggleSubmitDisabled(true);
    toggleHint(false);
    appendList(file);
    startRequest(file);
  }

  function appendList (file) {
    var dom = $(Template['web-upload-item']);
    dom.attr('id', 'list-processing');
    dom.find('.list-name').text(file.name);
    dom.find('.list-status').text('requesting...');
    $('.list-main').append(dom);
  }

  function startRequest (file) {

  }

  function toggleSubmitDisabled (disabled) {
    if (disabled) {
      $('#submit').attr('disabled', true);
    } else {
      $('#submit').removeAttr('disabled');
    }
  }

  function toggleHint(show) {
    if (show) {
      $('.list-hint').show();
    } else {
      $('.list-hint').hide();
    }
  }

})();