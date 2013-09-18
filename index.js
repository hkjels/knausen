
/**
 * Module dependencies.
 */

var express = require('express')
  , request = require('superagent')
  , app = module.exports = express();


/**
 * Middle-ware.
 */

app.use(express.logger('dev'));
app.use(express.favicon());
app.use(express.bodyParser());
app.use(express.compress());
app.use(express.static(__dirname + '/public'));
app.use(app.router);


/**
 * Scrape.
 */

var weather = 'http://www.weatherlink.com/user/kjero/index.php?view=summary&headers=1';
app.get('/weather', function(req, res) {
  request.get(weather).end(function(resp) {
    if (res.error) {
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
      return;
    }
  });
});

app.all('*', clientSide);


/**
 * Use client-side routing.
 */

function clientSide(req, res) {
  res.sendfile(__dirname + '/layout.html');
  return;
}


/**
 * Start listening for requests.
 */

if (!module.parent) {
  var port = process.env.PORT || 8080;
  app.listen(port);
  console.log('Hitra is up and running on port %d', port);
}

