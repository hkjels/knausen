
/**
 * Module dependencies.
 */

var Emitter = require('emitter')
  , domify = require('domify')
  , reactive = require('reactive')
  , templ = domify(require('./template.html'));

/**
 * Expose `WeatherView`.
 */

module.exports = WeatherView;

Emitter(WeatherView.prototype);

/**
 * WeatherView.
 */

function WeatherView(data) {
  this.data = data;
  this.el = templ;
  reactive(templ, this);
}

