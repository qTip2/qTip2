var $ = require('jquery');
var registerQtip = require('../dist/jquery.qtip.js');

registerQtip( $ );

$(function(){
  $('#test-button').qtip({
    content: 'Hello, world!',
    show: {
      event: 'click'
    },
    hide: {
      event: 'unfocus'
    }
  });
});
