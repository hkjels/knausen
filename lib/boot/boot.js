
/**
 * Module dependencies.
 */

var dom = require('dom')
  , page = require('page')
  , request = require('superagent');


var content = document.querySelector('#content');


page('/', overview);
page();


/**
 * Overview.
 */

function overview(ctx, next) {
  function render(res) {
    var weatherlink = dom('<div class="weatherlink">'+res.text+'</div>');
    var width = window.screen.width
    var height = (width / 640) * 480;
    height = height < window.screen.height ? height : window.screen.height;
    var camera = dom('<input type="image" width="'+width+'" height="'+height+'" name="NewPosition" />');
    camera.src('http://kjero12.viewnetcam.com/nphMotionJpeg?Resolution='+width+'x'+height+'&Quality=Standard');
    camera.appendTo(document.body);
    weatherlink.find('img').remove();
    weatherlink.appendTo(content);
  }

  request.get('/weather').end(render);
}

