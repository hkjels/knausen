
/**
 * Module dependencies.
 */

var WeatherView = require('weather-view')
  , dom = require('dom')
  , page = require('page')
  , request = require('superagent')
  , raf = require('raf')
  , sprintf = require('format').format;

/**
 * DOM-elements cache.
 */

var content = document.querySelector('#content');

/**
 * Routes.
 */

page('/', overview);
page('*', notfound);
raf(page);


/**
 * Overview.
 */

function overview(ctx, next) {
  var width = window.innerWidth || document.documentElement.clientWidth
    , height = window.innerHeight || document.documentElement.clientHeight;

  var camera = dom('<input type="image" width="'+width+'" height="'+height+'" name="NewPosition" />');
  camera.src('http://kjero12.viewnetcam.com/nphMotionJpeg?Resolution='+width+'x'+height+'&Quality=Standard');
  camera.appendTo(content);

  var weather = new WeatherView({
    'outsideTemp': '12',
    'insideTemp': '13',
    'windSpeed': '14'
  });
  content.appendChild(weather.el);

  function render(res) {
    if (res.ok) {
      Object.keys(res.body).forEach(function(key) {
        weather[key] = res.body[key].current;
        weather.emit('change ' + key);
      });
    }
  }

  function interval() {
    request.get('/weather').end(render);
    setTimeout(interval, 5000);
  }
  interval();
}


/**
 * Not found.
 */

function notfound(ctx) {
  var markup = dom('<h1>Page not found');
  markup.appendTo(content);
}

