
/**
 * Module dependencies.
 */

var express = require('express')
  , request = require('superagent')
  , debug = require('debug')
  , app = module.exports = express();



/**
 * Middle-ware.
 */

app.use(express.bodyParser());
app.use(express.compress());
app.use(express.static(__dirname + '/public'));
app.use(app.router);


/**
 * Scrape.
 */

var weather = 'http://www.weatherlink.com/user/kjero/index.php?view=summary&headers=1';
app.get('/weather', function(req, res) {
  debug('Request made');
  request.get(weather).end(function(resp) {
    if (res.error) {
      debug('Failed request');
      debug(res.error);
      console.error(res.error);
    } else {
      var text = resp.text
        , start = text.indexOf('<!-- START: SUMMARY WEATHER DISPLAY -->')
        , end = text.indexOf('<!-- END: SUMMARY WEATHER DISPLAY -->');
      text = text.substring(start, end);
      text = text.replace(/\<tr.*\<img.*tr\>/g, '');
      text = text.replace(/width..[^"]+"/g, '');
      text = text.replace(/\<hr.+\>/g, '');
      res.type('html');
      res.end(text);
    }
  });
});

app.all('*', clientSide);


/**
 * Use client-side routing.
 */

function clientSide(req, res) {
  res.sendfile(__dirname + '/layout.html');
}


/**
 * Start listening for requests.
 */

if (!module.parent) {
  app.listen(8080);
  console.log('Hitra is up and running on port %d', 8080);
}

