
/**
 * Module dependencies.
 */

var express = require('express')
  , request = require('superagent')
  , jsdom = require('jsdom')
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
 * Scrape weatherlink.
 */

app.get('/weather', function(req, res) {
  var uri = 'http://www.weatherlink.com/user/kjero/'
    , query = { view: 'summary', headers: '0' };

  /**
   * Parse weatherdata.
   *
   * @param {String} text
   */

  function parseWeatherTable(markup, cb) {
    var start = markup.indexOf('<!-- START: SUMMARY WEATHER DISPLAY -->')
      , end = markup.indexOf('<!-- END: SUMMARY WEATHER DISPLAY -->');

    // Remove garbage

    markup = markup
      .substring(start, end)
      .replace(/\<tr.*\<img.*tr\>/g, '')
      .replace(/width..[^"]+"/g, '')
      .replace(/\<hr.+\>/g, '');

    // Make JSON-representation of the table

    var info = {};
    jsdom.env(
      markup,
      ["http://code.jquery.com/jquery.js"],
      function(err, window) {
        if (err) cb(err);
        var dom = window.jQuery;
        dom('tr').each(function() {
          var key;
          dom(this).find('td').each(function(i, column) {
            if (dom(column).hasClass('summary_data')) {
              switch (i) {
                case 0:
                  key = dom(column).text()
                    .toLowerCase()
                    .replace(/\s(\w)/g, function (matches, letter) {
                      return letter.toUpperCase();
                    });
                  info[key] = {
                    current: '',
                    high: {},
                    low: {}
                  };
                  break;
                case 1:
                  info[key]['current'] = dom(column).text();
                  break;
                case 2:
                  info[key]['high']['value'] = dom(column).text();
                  break;
                case 3:
                  info[key]['high']['time'] = dom(column).text();
                  break;
                case 4:
                  info[key]['low']['value'] = dom(column).text();
                  break;
                case 5:
                  info[key]['low']['time'] = dom(column).text();
                  break;
              }
            }
          });
        });
        process.nextTick(function() {
          cb(false, info);
        });
      }
    );
  }

  // Request weatherdata

  function lookupWeatherInfo(resp) {
    if (res.error) {
      console.error(res.error);
    } else {
      parseWeatherTable(resp.text, function(err, info) {
        if (err) {
          return next(err);
        }
        return res.json(info);
      });
    }
  }

  request
    .get(uri)
    .query(query)
    .end(lookupWeatherInfo);
});



/**
 * Use client-side routing.
 */

app.all('*', clientSide);
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

