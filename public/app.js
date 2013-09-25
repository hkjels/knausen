
/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
  var resolved = require.resolve(path);

  // lookup failed
  if (null == resolved) {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
  }

  var module = require.modules[resolved];

  // perform real require()
  // by invoking the module's
  // registered function
  if (!module._resolving && !module.exports) {
    var mod = {};
    mod.exports = {};
    mod.client = mod.component = true;
    module._resolving = true;
    module.call(this, mod.exports, require.relative(resolved), mod);
    delete module._resolving;
    module.exports = mod.exports;
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path) {
  if (path.charAt(0) === '/') path = path.slice(1);

  var paths = [
    path,
    path + '.js',
    path + '.json',
    path + '/index.js',
    path + '/index.json'
  ];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (require.modules.hasOwnProperty(path)) return path;
    if (require.aliases.hasOwnProperty(path)) return require.aliases[path];
  }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' == path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }

  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
  require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
  if (!require.modules.hasOwnProperty(from)) {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
  require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * lastIndexOf helper.
   */

  function lastIndexOf(arr, obj) {
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function localRequire(path) {
    var resolved = localRequire.resolve(path);
    return require(resolved, parent, path);
  }

  /**
   * Resolve relative to the parent.
   */

  localRequire.resolve = function(path) {
    var c = path.charAt(0);
    if ('/' == c) return path.slice(1);
    if ('.' == c) return require.normalize(p, path);

    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    var segs = parent.split('/');
    var i = lastIndexOf(segs, 'deps') + 1;
    if (!i) i = 0;
    path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
    return path;
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return require.modules.hasOwnProperty(localRequire.resolve(path));
  };

  return localRequire;
};
require.register("component-type/index.js", function(exports, require, module){

/**
 * toString ref.
 */

var toString = Object.prototype.toString;

/**
 * Return the type of `val`.
 *
 * @param {Mixed} val
 * @return {String}
 * @api public
 */

module.exports = function(val){
  switch (toString.call(val)) {
    case '[object Function]': return 'function';
    case '[object Date]': return 'date';
    case '[object RegExp]': return 'regexp';
    case '[object Arguments]': return 'arguments';
    case '[object Array]': return 'array';
    case '[object String]': return 'string';
  }

  if (val === null) return 'null';
  if (val === undefined) return 'undefined';
  if (val && val.nodeType === 1) return 'element';
  if (val === Object(val)) return 'object';

  return typeof val;
};

});
require.register("component-event/index.js", function(exports, require, module){

/**
 * Bind `el` event `type` to `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.bind = function(el, type, fn, capture){
  if (el.addEventListener) {
    el.addEventListener(type, fn, capture);
  } else {
    el.attachEvent('on' + type, fn);
  }
  return fn;
};

/**
 * Unbind `el` event `type`'s callback `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.unbind = function(el, type, fn, capture){
  if (el.removeEventListener) {
    el.removeEventListener(type, fn, capture);
  } else {
    el.detachEvent('on' + type, fn);
  }
  return fn;
};

});
require.register("component-delegate/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var matches = require('matches-selector')
  , event = require('event');

/**
 * Delegate event `type` to `selector`
 * and invoke `fn(e)`. A callback function
 * is returned which may be passed to `.unbind()`.
 *
 * @param {Element} el
 * @param {String} selector
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.bind = function(el, selector, type, fn, capture){
  return event.bind(el, type, function(e){
    if (matches(e.target, selector)) fn(e);
  }, capture);
  return callback;
};

/**
 * Unbind event `type`'s callback `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @api public
 */

exports.unbind = function(el, type, fn, capture){
  event.unbind(el, type, fn, capture);
};

});
require.register("component-indexof/index.js", function(exports, require, module){

var indexOf = [].indexOf;

module.exports = function(arr, obj){
  if (indexOf) return arr.indexOf(obj);
  for (var i = 0; i < arr.length; ++i) {
    if (arr[i] === obj) return i;
  }
  return -1;
};
});
require.register("component-domify/index.js", function(exports, require, module){

/**
 * Expose `parse`.
 */

module.exports = parse;

/**
 * Wrap map from jquery.
 */

var map = {
  option: [1, '<select multiple="multiple">', '</select>'],
  optgroup: [1, '<select multiple="multiple">', '</select>'],
  legend: [1, '<fieldset>', '</fieldset>'],
  thead: [1, '<table>', '</table>'],
  tbody: [1, '<table>', '</table>'],
  tfoot: [1, '<table>', '</table>'],
  colgroup: [1, '<table>', '</table>'],
  caption: [1, '<table>', '</table>'],
  tr: [2, '<table><tbody>', '</tbody></table>'],
  td: [3, '<table><tbody><tr>', '</tr></tbody></table>'],
  th: [3, '<table><tbody><tr>', '</tr></tbody></table>'],
  col: [2, '<table><tbody></tbody><colgroup>', '</colgroup></table>'],
  _default: [0, '', '']
};

/**
 * Parse `html` and return the children.
 *
 * @param {String} html
 * @return {Array}
 * @api private
 */

function parse(html) {
  if ('string' != typeof html) throw new TypeError('String expected');

  // tag name
  var m = /<([\w:]+)/.exec(html);
  if (!m) throw new Error('No elements were generated.');
  var tag = m[1];

  // body support
  if (tag == 'body') {
    var el = document.createElement('html');
    el.innerHTML = html;
    return el.removeChild(el.lastChild);
  }

  // wrap map
  var wrap = map[tag] || map._default;
  var depth = wrap[0];
  var prefix = wrap[1];
  var suffix = wrap[2];
  var el = document.createElement('div');
  el.innerHTML = prefix + html + suffix;
  while (depth--) el = el.lastChild;

  var els = el.children;
  if (1 == els.length) {
    return el.removeChild(els[0]);
  }

  var fragment = document.createDocumentFragment();
  while (els.length) {
    fragment.appendChild(el.removeChild(els[0]));
  }

  return fragment;
}

});
require.register("component-classes/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var index = require('indexof');

/**
 * Whitespace regexp.
 */

var re = /\s+/;

/**
 * toString reference.
 */

var toString = Object.prototype.toString;

/**
 * Wrap `el` in a `ClassList`.
 *
 * @param {Element} el
 * @return {ClassList}
 * @api public
 */

module.exports = function(el){
  return new ClassList(el);
};

/**
 * Initialize a new ClassList for `el`.
 *
 * @param {Element} el
 * @api private
 */

function ClassList(el) {
  this.el = el;
  this.list = el.classList;
}

/**
 * Add class `name` if not already present.
 *
 * @param {String} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.add = function(name){
  // classList
  if (this.list) {
    this.list.add(name);
    return this;
  }

  // fallback
  var arr = this.array();
  var i = index(arr, name);
  if (!~i) arr.push(name);
  this.el.className = arr.join(' ');
  return this;
};

/**
 * Remove class `name` when present, or
 * pass a regular expression to remove
 * any which match.
 *
 * @param {String|RegExp} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.remove = function(name){
  if ('[object RegExp]' == toString.call(name)) {
    return this.removeMatching(name);
  }

  // classList
  if (this.list) {
    this.list.remove(name);
    return this;
  }

  // fallback
  var arr = this.array();
  var i = index(arr, name);
  if (~i) arr.splice(i, 1);
  this.el.className = arr.join(' ');
  return this;
};

/**
 * Remove all classes matching `re`.
 *
 * @param {RegExp} re
 * @return {ClassList}
 * @api private
 */

ClassList.prototype.removeMatching = function(re){
  var arr = this.array();
  for (var i = 0; i < arr.length; i++) {
    if (re.test(arr[i])) {
      this.remove(arr[i]);
    }
  }
  return this;
};

/**
 * Toggle class `name`.
 *
 * @param {String} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.toggle = function(name){
  // classList
  if (this.list) {
    this.list.toggle(name);
    return this;
  }

  // fallback
  if (this.has(name)) {
    this.remove(name);
  } else {
    this.add(name);
  }
  return this;
};

/**
 * Return an array of classes.
 *
 * @return {Array}
 * @api public
 */

ClassList.prototype.array = function(){
  var str = this.el.className.replace(/^\s+|\s+$/g, '');
  var arr = str.split(re);
  if ('' === arr[0]) arr.shift();
  return arr;
};

/**
 * Check if class `name` is present.
 *
 * @param {String} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.has =
ClassList.prototype.contains = function(name){
  return this.list
    ? this.list.contains(name)
    : !! ~index(this.array(), name);
};

});
require.register("component-css/index.js", function(exports, require, module){

/**
 * Properties to ignore appending "px".
 */

var ignore = {
  columnCount: true,
  fillOpacity: true,
  fontWeight: true,
  lineHeight: true,
  opacity: true,
  orphans: true,
  widows: true,
  zIndex: true,
  zoom: true
};

/**
 * Set `el` css values.
 *
 * @param {Element} el
 * @param {Object} obj
 * @return {Element}
 * @api public
 */

module.exports = function(el, obj){
  for (var key in obj) {
    var val = obj[key];
    if ('number' == typeof val && !ignore[key]) val += 'px';
    el.style[key] = val;
  }
  return el;
};

});
require.register("component-sort/index.js", function(exports, require, module){

/**
 * Expose `sort`.
 */

exports = module.exports = sort;

/**
 * Sort `el`'s children with the given `fn(a, b)`.
 *
 * @param {Element} el
 * @param {Function} fn
 * @api public
 */

function sort(el, fn) {
  var arr = [].slice.call(el.children).sort(fn);
  var frag = document.createDocumentFragment();
  for (var i = 0; i < arr.length; i++) {
    frag.appendChild(arr[i]);
  }
  el.appendChild(frag);
};

/**
 * Sort descending.
 *
 * @param {Element} el
 * @param {Function} fn
 * @api public
 */

exports.desc = function(el, fn){
  sort(el, function(a, b){
    return ~fn(a, b) + 1;
  });
};

/**
 * Sort ascending.
 */

exports.asc = sort;

});
require.register("component-value/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var typeOf = require('type');

/**
 * Set or get `el`'s' value.
 *
 * @param {Element} el
 * @param {Mixed} val
 * @return {Mixed}
 * @api public
 */

module.exports = function(el, val){
  if (2 == arguments.length) return set(el, val);
  return get(el);
};

/**
 * Get `el`'s value.
 */

function get(el) {
  switch (type(el)) {
    case 'checkbox':
    case 'radio':
      if (el.checked) {
        var attr = el.getAttribute('value');
        return null == attr ? true : attr;
      } else {
        return false;
      }
    case 'radiogroup':
      for (var i = 0, radio; radio = el[i]; i++) {
        if (radio.checked) return radio.value;
      }
      break;
    case 'select':
      for (var i = 0, option; option = el.options[i]; i++) {
        if (option.selected) return option.value;
      }
      break;
    default:
      return el.value;
  }
}

/**
 * Set `el`'s value.
 */

function set(el, val) {
  switch (type(el)) {
    case 'checkbox':
    case 'radio':
      if (val) {
        el.checked = true;
      } else {
        el.checked = false;
      }
      break;
    case 'radiogroup':
      for (var i = 0, radio; radio = el[i]; i++) {
        radio.checked = radio.value === val;
      }
      break;
    case 'select':
      for (var i = 0, option; option = el.options[i]; i++) {
        option.selected = option.value === val;
      }
      break;
    default:
      el.value = val;
  }
}

/**
 * Element type.
 */

function type(el) {
  var group = 'array' == typeOf(el) || 'object' == typeOf(el);
  if (group) el = el[0];
  var name = el.nodeName.toLowerCase();
  var type = el.getAttribute('type');

  if (group && type && 'radio' == type.toLowerCase()) return 'radiogroup';
  if ('input' == name && type && 'checkbox' == type.toLowerCase()) return 'checkbox';
  if ('input' == name && type && 'radio' == type.toLowerCase()) return 'radio';
  if ('select' == name) return 'select';
  return name;
}

});
require.register("component-query/index.js", function(exports, require, module){

function one(selector, el) {
  return el.querySelector(selector);
}

exports = module.exports = function(selector, el){
  el = el || document;
  return one(selector, el);
};

exports.all = function(selector, el){
  el = el || document;
  return el.querySelectorAll(selector);
};

exports.engine = function(obj){
  if (!obj.one) throw new Error('.one callback required');
  if (!obj.all) throw new Error('.all callback required');
  one = obj.one;
  exports.all = obj.all;
};

});
require.register("component-matches-selector/index.js", function(exports, require, module){
/**
 * Module dependencies.
 */

var query = require('query');

/**
 * Element prototype.
 */

var proto = Element.prototype;

/**
 * Vendor function.
 */

var vendor = proto.matchesSelector
  || proto.webkitMatchesSelector
  || proto.mozMatchesSelector
  || proto.msMatchesSelector
  || proto.oMatchesSelector;

/**
 * Expose `match()`.
 */

module.exports = match;

/**
 * Match `el` to `selector`.
 *
 * @param {Element} el
 * @param {String} selector
 * @return {Boolean}
 * @api public
 */

function match(el, selector) {
  if (vendor) return vendor.call(el, selector);
  var nodes = query.all(selector, el.parentNode);
  for (var i = 0; i < nodes.length; ++i) {
    if (nodes[i] == el) return true;
  }
  return false;
}

});
require.register("yields-traverse/index.js", function(exports, require, module){

/**
 * dependencies
 */

var matches = require('matches-selector');

/**
 * Traverse with the given `el`, `selector` and `len`.
 *
 * @param {String} type
 * @param {Element} el
 * @param {String} selector
 * @param {Number} len
 * @return {Array}
 * @api public
 */

module.exports = function(type, el, selector, len){
  var el = el[type]
    , n = len || 1
    , ret = [];

  if (!el) return ret;

  do {
    if (n == ret.length) break;
    if (1 != el.nodeType) continue;
    if (matches(el, selector)) ret.push(el);
    if (!selector) ret.push(el);
  } while (el = el[type]);

  return ret;
}

});
require.register("component-dom/index.js", function(exports, require, module){
/**
 * Module dependencies.
 */

var matches = require('matches-selector');
var delegate = require('delegate');
var classes = require('classes');
var traverse = require('traverse');
var indexof = require('indexof');
var domify = require('domify');
var events = require('event');
var value = require('value');
var query = require('query');
var type = require('type');
var css = require('css');

/**
 * Attributes supported.
 */

var attrs = [
  'id',
  'src',
  'rel',
  'cols',
  'rows',
  'type',
  'name',
  'href',
  'title',
  'style',
  'width',
  'height',
  'action',
  'method',
  'tabindex',
  'placeholder'
];

/**
 * Expose `dom()`.
 */

exports = module.exports = dom;

/**
 * Expose supported attrs.
 */

exports.attrs = attrs;

/**
 * Return a dom `List` for the given
 * `html`, selector, or element.
 *
 * @param {String|Element|List}
 * @return {List}
 * @api public
 */

function dom(selector, context) {
  // array
  if (Array.isArray(selector)) {
    return new List(selector);
  }

  // List
  if (selector instanceof List) {
    return selector;
  }

  // node
  if (selector.nodeName) {
    return new List([selector]);
  }

  if ('string' != typeof selector) {
    throw new TypeError('invalid selector');
  }

  // html
  if ('<' == selector.charAt(0)) {
    return new List([domify(selector)], selector);
  }

  // selector
  var ctx = context
    ? (context.els ? context.els[0] : context)
    : document;

  return new List(query.all(selector, ctx), selector);
}

/**
 * Expose `List` constructor.
 */

exports.List = List;

/**
 * Initialize a new `List` with the
 * given array-ish of `els` and `selector`
 * string.
 *
 * @param {Mixed} els
 * @param {String} selector
 * @api private
 */

function List(els, selector) {
  this.els = els || [];
  this.selector = selector;
}

/**
 * Enumerable iterator.
 */

List.prototype.__iterate__ = function(){
  var self = this;
  return {
    length: function(){ return self.els.length },
    get: function(i){ return new List([self.els[i]]) }
  }
};

/**
 * Remove elements from the DOM.
 *
 * @api public
 */

List.prototype.remove = function(){
  for (var i = 0; i < this.els.length; i++) {
    var el = this.els[i];
    var parent = el.parentNode;
    if (parent) parent.removeChild(el);
  }
};

/**
 * Set attribute `name` to `val`, or get attr `name`.
 *
 * @param {String} name
 * @param {String} [val]
 * @return {String|List} self
 * @api public
 */

List.prototype.attr = function(name, val){
  // get
  if (1 == arguments.length) {
    return this.els[0] && this.els[0].getAttribute(name);
  }

  // remove
  if (null == val) {
    return this.removeAttr(name);
  }

  // set
  return this.forEach(function(el){
    el.setAttribute(name, val);
  });
};

/**
 * Remove attribute `name`.
 *
 * @param {String} name
 * @return {List} self
 * @api public
 */

List.prototype.removeAttr = function(name){
  return this.forEach(function(el){
    el.removeAttribute(name);
  });
};

/**
 * Set property `name` to `val`, or get property `name`.
 *
 * @param {String} name
 * @param {String} [val]
 * @return {Object|List} self
 * @api public
 */

List.prototype.prop = function(name, val){
  if (1 == arguments.length) {
    return this.els[0] && this.els[0][name];
  }

  return this.forEach(function(el){
    el[name] = val;
  });
};

/**
 * Get the first element's value or set selected
 * element values to `val`.
 *
 * @param {Mixed} [val]
 * @return {Mixed}
 * @api public
 */

List.prototype.val =
List.prototype.value = function(val){
  if (0 == arguments.length) {
    return this.els[0]
      ? value(this.els[0])
      : undefined;
  }

  return this.forEach(function(el){
    value(el, val);
  });
};

/**
 * Return a cloned `List` with all elements cloned.
 *
 * @return {List}
 * @api public
 */

List.prototype.clone = function(){
  var arr = [];
  for (var i = 0, len = this.els.length; i < len; ++i) {
    arr.push(this.els[i].cloneNode(true));
  }
  return new List(arr);
};

/**
 * Prepend `val`.
 *
 * @param {String|Element|List} val
 * @return {List} new list
 * @api public
 */

List.prototype.prepend = function(val){
  var el = this.els[0];
  if (!el) return this;
  val = dom(val);
  for (var i = 0; i < val.els.length; ++i) {
    if (el.children.length) {
      el.insertBefore(val.els[i], el.firstChild);
    } else {
      el.appendChild(val.els[i]);
    }
  }
  return val;
};

/**
 * Append `val`.
 *
 * @param {String|Element|List} val
 * @return {List} new list
 * @api public
 */

List.prototype.append = function(val){
  var el = this.els[0];
  if (!el) return this;
  val = dom(val);
  for (var i = 0; i < val.els.length; ++i) {
    el.appendChild(val.els[i]);
  }
  return val;
};

/**
 * Append self's `el` to `val`
 *
 * @param {String|Element|List} val
 * @return {List} self
 * @api public
 */

List.prototype.appendTo = function(val){
  dom(val).append(this);
  return this;
};

/**
 * Insert self's `els` after `val`
 *
 * @param {String|Element|List} val
 * @return {List} self
 * @api public
 */

List.prototype.insertAfter = function(val){
  val = dom(val).els[0];
  if (!val || !val.parentNode) return this;
  this.forEach(function(el){
    val.parentNode.insertBefore(el, val.nextSibling);
  });
  return this;
};

/**
 * Return a `List` containing the element at `i`.
 *
 * @param {Number} i
 * @return {List}
 * @api public
 */

List.prototype.at = function(i){
  return new List([this.els[i]], this.selector);
};

/**
 * Return a `List` containing the first element.
 *
 * @param {Number} i
 * @return {List}
 * @api public
 */

List.prototype.first = function(){
  return new List([this.els[0]], this.selector);
};

/**
 * Return a `List` containing the last element.
 *
 * @param {Number} i
 * @return {List}
 * @api public
 */

List.prototype.last = function(){
  return new List([this.els[this.els.length - 1]], this.selector);
};

/**
 * Return an `Element` at `i`.
 *
 * @param {Number} i
 * @return {Element}
 * @api public
 */

List.prototype.get = function(i){
  return this.els[i || 0];
};

/**
 * Return list length.
 *
 * @return {Number}
 * @api public
 */

List.prototype.length = function(){
  return this.els.length;
};

/**
 * Return element text.
 *
 * @param {String} str
 * @return {String|List}
 * @api public
 */

List.prototype.text = function(str){
  // TODO: real impl
  if (1 == arguments.length) {
    this.forEach(function(el){
      el.textContent = str;
    });
    return this;
  }

  var str = '';
  for (var i = 0; i < this.els.length; ++i) {
    str += this.els[i].textContent;
  }
  return str;
};

/**
 * Return element html.
 *
 * @return {String} html
 * @api public
 */

List.prototype.html = function(html){
  if (1 == arguments.length) {
    this.forEach(function(el){
      el.innerHTML = html;
    });
  }
  // TODO: real impl
  return this.els[0] && this.els[0].innerHTML;
};

/**
 * Bind to `event` and invoke `fn(e)`. When
 * a `selector` is given then events are delegated.
 *
 * @param {String} event
 * @param {String} [selector]
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {List}
 * @api public
 */

List.prototype.on = function(event, selector, fn, capture){
  if ('string' == typeof selector) {
    for (var i = 0; i < this.els.length; ++i) {
      fn._delegate = delegate.bind(this.els[i], selector, event, fn, capture);
    }
    return this;
  }

  capture = fn;
  fn = selector;

  for (var i = 0; i < this.els.length; ++i) {
    events.bind(this.els[i], event, fn, capture);
  }

  return this;
};

/**
 * Unbind to `event` and invoke `fn(e)`. When
 * a `selector` is given then delegated event
 * handlers are unbound.
 *
 * @param {String} event
 * @param {String} [selector]
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {List}
 * @api public
 */

List.prototype.off = function(event, selector, fn, capture){
  if ('string' == typeof selector) {
    for (var i = 0; i < this.els.length; ++i) {
      // TODO: add selector support back
      delegate.unbind(this.els[i], event, fn._delegate, capture);
    }
    return this;
  }

  capture = fn;
  fn = selector;

  for (var i = 0; i < this.els.length; ++i) {
    events.unbind(this.els[i], event, fn, capture);
  }
  return this;
};

/**
 * Iterate elements and invoke `fn(list, i)`.
 *
 * @param {Function} fn
 * @return {List} self
 * @api public
 */

List.prototype.each = function(fn){
  for (var i = 0; i < this.els.length; ++i) {
    fn(new List([this.els[i]], this.selector), i);
  }
  return this;
};

/**
 * Iterate elements and invoke `fn(el, i)`.
 *
 * @param {Function} fn
 * @return {List} self
 * @api public
 */

List.prototype.forEach = function(fn){
  for (var i = 0; i < this.els.length; ++i) {
    fn(this.els[i], i);
  }
  return this;
};

/**
 * Map elements invoking `fn(list, i)`.
 *
 * @param {Function} fn
 * @return {Array}
 * @api public
 */

List.prototype.map = function(fn){
  var arr = [];
  for (var i = 0; i < this.els.length; ++i) {
    arr.push(fn(new List([this.els[i]], this.selector), i));
  }
  return arr;
};

/**
 * Filter elements invoking `fn(list, i)`, returning
 * a new `List` of elements when a truthy value is returned.
 *
 * @param {Function} fn
 * @return {List}
 * @api public
 */

List.prototype.select =
List.prototype.filter = function(fn){
  var el;
  var list = new List([], this.selector);
  for (var i = 0; i < this.els.length; ++i) {
    el = this.els[i];
    if (fn(new List([el], this.selector), i)) list.els.push(el);
  }
  return list;
};

/**
 * Filter elements invoking `fn(list, i)`, returning
 * a new `List` of elements when a falsey value is returned.
 *
 * @param {Function} fn
 * @return {List}
 * @api public
 */

List.prototype.reject = function(fn){
  var el;
  var list = new List([], this.selector);
  for (var i = 0; i < this.els.length; ++i) {
    el = this.els[i];
    if (!fn(new List([el], this.selector), i)) list.els.push(el);
  }
  return list;
};

/**
 * Add the given class `name`.
 *
 * @param {String} name
 * @return {List} self
 * @api public
 */

List.prototype.addClass = function(name){
  var el;
  for (var i = 0; i < this.els.length; ++i) {
    el = this.els[i];
    el._classes = el._classes || classes(el);
    el._classes.add(name);
  }
  return this;
};

/**
 * Remove the given class `name`.
 *
 * @param {String|RegExp} name
 * @return {List} self
 * @api public
 */

List.prototype.removeClass = function(name){
  var el;

  if ('regexp' == type(name)) {
    for (var i = 0; i < this.els.length; ++i) {
      el = this.els[i];
      el._classes = el._classes || classes(el);
      var arr = el._classes.array();
      for (var j = 0; j < arr.length; j++) {
        if (name.test(arr[j])) {
          el._classes.remove(arr[j]);
        }
      }
    }
    return this;
  }

  for (var i = 0; i < this.els.length; ++i) {
    el = this.els[i];
    el._classes = el._classes || classes(el);
    el._classes.remove(name);
  }

  return this;
};

/**
 * Toggle the given class `name`,
 * optionally a `bool` may be given
 * to indicate that the class should
 * be added when truthy.
 *
 * @param {String} name
 * @param {Boolean} bool
 * @return {List} self
 * @api public
 */

List.prototype.toggleClass = function(name, bool){
  var el;
  var fn = 'toggle';

  // toggle with boolean
  if (2 == arguments.length) {
    fn = bool ? 'add' : 'remove';
  }

  for (var i = 0; i < this.els.length; ++i) {
    el = this.els[i];
    el._classes = el._classes || classes(el);
    el._classes[fn](name);
  }

  return this;
};

/**
 * Check if the given class `name` is present.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */

List.prototype.hasClass = function(name){
  var el;
  for (var i = 0; i < this.els.length; ++i) {
    el = this.els[i];
    el._classes = el._classes || classes(el);
    if (el._classes.has(name)) return true;
  }
  return false;
};

/**
 * Set CSS `prop` to `val` or get `prop` value.
 * Also accepts an object (`prop`: `val`)
 *
 * @param {String} prop
 * @param {Mixed} val
 * @return {List|String}
 * @api public
 */

List.prototype.css = function(prop, val){
  if (2 == arguments.length) {
    var obj = {};
    obj[prop] = val;
    return this.setStyle(obj);
  }

  if ('object' == type(prop)) {
    return this.setStyle(prop);
  }

  return this.getStyle(prop);
};

/**
 * Set CSS `props`.
 *
 * @param {Object} props
 * @return {List} self
 * @api private
 */

List.prototype.setStyle = function(props){
  for (var i = 0; i < this.els.length; ++i) {
    css(this.els[i], props);
  }
  return this;
};

/**
 * Get CSS `prop` value.
 *
 * @param {String} prop
 * @return {String}
 * @api private
 */

List.prototype.getStyle = function(prop){
  var el = this.els[0];
  if (el) return el.style[prop];
};

/**
 * Find children matching the given `selector`.
 *
 * @param {String} selector
 * @return {List}
 * @api public
 */

List.prototype.find = function(selector){
  return dom(selector, this);
};

/**
 * Empty the dom list
 *
 * @return self
 * @api public
 */

List.prototype.empty = function(){
  var elem, el;

  for (var i = 0; i < this.els.length; ++i) {
    el = this.els[i];
    while (el.firstChild) {
      el.removeChild(el.firstChild);
    }
  }

  return this;
}

/**
 * Check if the first element matches `selector`.
 *
 * @param {String} selector
 * @return {Boolean}
 * @api public
 */

List.prototype.is = function(selector){
  return matches(this.get(0), selector);
};

/**
 * Get parent(s) with optional `selector` and `limit`
 *
 * @param {String} selector
 * @param {Number} limit
 * @return {List}
 * @api public
 */

List.prototype.parent = function(selector, limit){
  return new List(traverse('parentNode',
    this.get(0),
    selector,
    limit
    || 1));
};

/**
 * Get next element(s) with optional `selector` and `limit`.
 *
 * @param {String} selector
 * @param {Number} limit
 * @retrun {List}
 * @api public
 */

List.prototype.next = function(selector, limit){
  return new List(traverse('nextSibling',
    this.get(0),
    selector,
    limit
    || 1));
};

/**
 * Get previous element(s) with optional `selector` and `limit`.
 *
 * @param {String} selector
 * @param {Number} limit
 * @return {List}
 * @api public
 */

List.prototype.prev =
List.prototype.previous = function(selector, limit){
  return new List(traverse('previousSibling',
    this.get(0),
    selector,
    limit
    || 1));
};

/**
 * Attribute accessors.
 */

attrs.forEach(function(name){
  List.prototype[name] = function(val){
    if (0 == arguments.length) return this.attr(name);
    return this.attr(name, val);
  };
});


});
require.register("component-raf/index.js", function(exports, require, module){

/**
 * Expose `requestAnimationFrame()`.
 */

exports = module.exports = window.requestAnimationFrame
  || window.webkitRequestAnimationFrame
  || window.mozRequestAnimationFrame
  || window.oRequestAnimationFrame
  || window.msRequestAnimationFrame
  || fallback;

/**
 * Fallback implementation.
 */

var prev = new Date().getTime();
function fallback(fn) {
  var curr = new Date().getTime();
  var ms = Math.max(0, 16 - (curr - prev));
  setTimeout(fn, ms);
  prev = curr;
}

/**
 * Cancel.
 */

var cancel = window.cancelAnimationFrame
  || window.webkitCancelAnimationFrame
  || window.mozCancelAnimationFrame
  || window.oCancelAnimationFrame
  || window.msCancelAnimationFrame;

exports.cancel = function(id){
  cancel.call(window, id);
};

});
require.register("component-to-function/index.js", function(exports, require, module){

/**
 * Expose `toFunction()`.
 */

module.exports = toFunction;

/**
 * Convert `obj` to a `Function`.
 *
 * @param {Mixed} obj
 * @return {Function}
 * @api private
 */

function toFunction(obj) {
  switch ({}.toString.call(obj)) {
    case '[object Object]':
      return objectToFunction(obj);
    case '[object Function]':
      return obj;
    case '[object String]':
      return stringToFunction(obj);
    case '[object RegExp]':
      return regexpToFunction(obj);
    default:
      return defaultToFunction(obj);
  }
}

/**
 * Default to strict equality.
 *
 * @param {Mixed} val
 * @return {Function}
 * @api private
 */

function defaultToFunction(val) {
  return function(obj){
    return val === obj;
  }
}

/**
 * Convert `re` to a function.
 *
 * @param {RegExp} re
 * @return {Function}
 * @api private
 */

function regexpToFunction(re) {
  return function(obj){
    return re.test(obj);
  }
}

/**
 * Convert property `str` to a function.
 *
 * @param {String} str
 * @return {Function}
 * @api private
 */

function stringToFunction(str) {
  // immediate such as "> 20"
  if (/^ *\W+/.test(str)) return new Function('_', 'return _ ' + str);

  // properties such as "name.first" or "age > 18"
  return new Function('_', 'return _.' + str);
}

/**
 * Convert `object` to a function.
 *
 * @param {Object} object
 * @return {Function}
 * @api private
 */

function objectToFunction(obj) {
  var match = {}
  for (var key in obj) {
    match[key] = typeof obj[key] === 'string'
      ? defaultToFunction(obj[key])
      : toFunction(obj[key])
  }
  return function(val){
    if (typeof val !== 'object') return false;
    for (var key in match) {
      if (!(key in val)) return false;
      if (!match[key](val[key])) return false;
    }
    return true;
  }
}

});
require.register("component-each/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var toFunction = require('to-function');
var type;

try {
  type = require('type-component');
} catch (e) {
  type = require('type');
}

/**
 * HOP reference.
 */

var has = Object.prototype.hasOwnProperty;

/**
 * Iterate the given `obj` and invoke `fn(val, i)`.
 *
 * @param {String|Array|Object} obj
 * @param {Function} fn
 * @api public
 */

module.exports = function(obj, fn){
  fn = toFunction(fn);
  switch (type(obj)) {
    case 'array':
      return array(obj, fn);
    case 'object':
      if ('number' == typeof obj.length) return array(obj, fn);
      return object(obj, fn);
    case 'string':
      return string(obj, fn);
  }
};

/**
 * Iterate string chars.
 *
 * @param {String} obj
 * @param {Function} fn
 * @api private
 */

function string(obj, fn) {
  for (var i = 0; i < obj.length; ++i) {
    fn(obj.charAt(i), i);
  }
}

/**
 * Iterate object keys.
 *
 * @param {Object} obj
 * @param {Function} fn
 * @api private
 */

function object(obj, fn) {
  for (var key in obj) {
    if (has.call(obj, key)) {
      fn(key, obj[key]);
    }
  }
}

/**
 * Iterate array-ish.
 *
 * @param {Array|Object} obj
 * @param {Function} fn
 * @api private
 */

function array(obj, fn) {
  for (var i = 0; i < obj.length; ++i) {
    fn(obj[i], i);
  }
}

});
require.register("component-emitter/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var index = require('indexof');

/**
 * Expose `Emitter`.
 */

module.exports = Emitter;

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks[event] = this._callbacks[event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  var self = this;
  this._callbacks = this._callbacks || {};

  function on() {
    self.off(event, on);
    fn.apply(this, arguments);
  }

  fn._off = on;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks[event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks[event];
    return this;
  }

  // remove specific handler
  var i = index(callbacks, fn._off || fn);
  if (~i) callbacks.splice(i, 1);
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks[event];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks[event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

});
require.register("component-enumerable/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var toFunction = require('to-function')
  , proto = {};

/**
 * Expose `Enumerable`.
 */

module.exports = Enumerable;

/**
 * Mixin to `obj`.
 *
 *    var Enumerable = require('enumerable');
 *    Enumerable(Something.prototype);
 *
 * @param {Object} obj
 * @return {Object} obj
 */

function mixin(obj){
  for (var key in proto) obj[key] = proto[key];
  obj.__iterate__ = obj.__iterate__ || defaultIterator;
  return obj;
}

/**
 * Initialize a new `Enumerable` with the given `obj`.
 *
 * @param {Object} obj
 * @api private
 */

function Enumerable(obj) {
  if (!(this instanceof Enumerable)) {
    if (Array.isArray(obj)) return new Enumerable(obj);
    return mixin(obj);
  }
  this.obj = obj;
}

/*!
 * Default iterator utilizing `.length` and subscripts.
 */

function defaultIterator() {
  var self = this;
  return {
    length: function(){ return self.length },
    get: function(i){ return self[i] }
  }
}

/**
 * Return a string representation of this enumerable.
 *
 *    [Enumerable [1,2,3]]
 *
 * @return {String}
 * @api public
 */

Enumerable.prototype.inspect =
Enumerable.prototype.toString = function(){
  return '[Enumerable ' + JSON.stringify(this.obj) + ']';
};

/**
 * Iterate enumerable.
 *
 * @return {Object}
 * @api private
 */

Enumerable.prototype.__iterate__ = function(){
  var obj = this.obj;
  obj.__iterate__ = obj.__iterate__ || defaultIterator;
  return obj.__iterate__();
};

/**
 * Iterate each value and invoke `fn(val, i)`.
 *
 *    users.each(function(val, i){
 *
 *    })
 *
 * @param {Function} fn
 * @return {Object} self
 * @api public
 */

proto.forEach =
proto.each = function(fn){
  var vals = this.__iterate__();
  var len = vals.length();
  for (var i = 0; i < len; ++i) {
    fn(vals.get(i), i);
  }
  return this;
};

/**
 * Map each return value from `fn(val, i)`.
 *
 * Passing a callback function:
 *
 *    users.map(function(user){
 *      return user.name.first
 *    })
 *
 * Passing a property string:
 *
 *    users.map('name.first')
 *
 * @param {Function} fn
 * @return {Enumerable}
 * @api public
 */

proto.map = function(fn){
  fn = toFunction(fn);
  var vals = this.__iterate__();
  var len = vals.length();
  var arr = [];
  for (var i = 0; i < len; ++i) {
    arr.push(fn(vals.get(i), i));
  }
  return new Enumerable(arr);
};

/**
 * Select all values that return a truthy value of `fn(val, i)`.
 *
 *    users.select(function(user){
 *      return user.age > 20
 *    })
 *
 *  With a property:
 *
 *    items.select('complete')
 *
 * @param {Function|String} fn
 * @return {Enumerable}
 * @api public
 */

proto.filter =
proto.select = function(fn){
  fn = toFunction(fn);
  var val;
  var arr = [];
  var vals = this.__iterate__();
  var len = vals.length();
  for (var i = 0; i < len; ++i) {
    val = vals.get(i);
    if (fn(val, i)) arr.push(val);
  }
  return new Enumerable(arr);
};

/**
 * Select all unique values.
 *
 *    nums.unique()
 *
 * @return {Enumerable}
 * @api public
 */

proto.unique = function(){
  var val;
  var arr = [];
  var vals = this.__iterate__();
  var len = vals.length();
  for (var i = 0; i < len; ++i) {
    val = vals.get(i);
    if (~arr.indexOf(val)) continue;
    arr.push(val);
  }
  return new Enumerable(arr);
};

/**
 * Reject all values that return a truthy value of `fn(val, i)`.
 *
 * Rejecting using a callback:
 *
 *    users.reject(function(user){
 *      return user.age < 20
 *    })
 *
 * Rejecting with a property:
 *
 *    items.reject('complete')
 *
 * Rejecting values via `==`:
 *
 *    data.reject(null)
 *    users.reject(tobi)
 *
 * @param {Function|String|Mixed} fn
 * @return {Enumerable}
 * @api public
 */

proto.reject = function(fn){
  var val;
  var arr = [];
  var vals = this.__iterate__();
  var len = vals.length();

  if ('string' == typeof fn) fn = toFunction(fn);

  if (fn) {
    for (var i = 0; i < len; ++i) {
      val = vals.get(i);
      if (!fn(val, i)) arr.push(val);
    }
  } else {
    for (var i = 0; i < len; ++i) {
      val = vals.get(i);
      if (val != fn) arr.push(val);
    }
  }

  return new Enumerable(arr);
};

/**
 * Reject `null` and `undefined`.
 *
 *    [1, null, 5, undefined].compact()
 *    // => [1,5]
 *
 * @return {Enumerable}
 * @api public
 */


proto.compact = function(){
  return this.reject(null);
};

/**
 * Return the first value when `fn(val, i)` is truthy,
 * otherwise return `undefined`.
 *
 *    users.find(function(user){
 *      return user.role == 'admin'
 *    })
 *
 * With a property string:
 *
 *    users.find('age > 20')
 *
 * @param {Function|String} fn
 * @return {Mixed}
 * @api public
 */

proto.find = function(fn){
  fn = toFunction(fn);
  var val;
  var vals = this.__iterate__();
  var len = vals.length();
  for (var i = 0; i < len; ++i) {
    val = vals.get(i);
    if (fn(val, i)) return val;
  }
};

/**
 * Return the last value when `fn(val, i)` is truthy,
 * otherwise return `undefined`.
 *
 *    users.findLast(function(user){
 *      return user.role == 'admin'
 *    })
 *
 * @param {Function} fn
 * @return {Mixed}
 * @api public
 */

proto.findLast = function(fn){
  fn = toFunction(fn);
  var val;
  var vals = this.__iterate__();
  var len = vals.length();
  for (var i = len - 1; i > -1; --i) {
    val = vals.get(i);
    if (fn(val, i)) return val;
  }
};

/**
 * Assert that all invocations of `fn(val, i)` are truthy.
 *
 * For example ensuring that all pets are ferrets:
 *
 *    pets.all(function(pet){
 *      return pet.species == 'ferret'
 *    })
 *
 *    users.all('admin')
 *
 * @param {Function|String} fn
 * @return {Boolean}
 * @api public
 */

proto.all =
proto.every = function(fn){
  fn = toFunction(fn);
  var val;
  var vals = this.__iterate__();
  var len = vals.length();
  for (var i = 0; i < len; ++i) {
    val = vals.get(i);
    if (!fn(val, i)) return false;
  }
  return true;
};

/**
 * Assert that none of the invocations of `fn(val, i)` are truthy.
 *
 * For example ensuring that no pets are admins:
 *
 *    pets.none(function(p){ return p.admin })
 *    pets.none('admin')
 *
 * @param {Function|String} fn
 * @return {Boolean}
 * @api public
 */

proto.none = function(fn){
  fn = toFunction(fn);
  var val;
  var vals = this.__iterate__();
  var len = vals.length();
  for (var i = 0; i < len; ++i) {
    val = vals.get(i);
    if (fn(val, i)) return false;
  }
  return true;
};

/**
 * Assert that at least one invocation of `fn(val, i)` is truthy.
 *
 * For example checking to see if any pets are ferrets:
 *
 *    pets.any(function(pet){
 *      return pet.species == 'ferret'
 *    })
 *
 * @param {Function} fn
 * @return {Boolean}
 * @api public
 */

proto.any = function(fn){
  fn = toFunction(fn);
  var val;
  var vals = this.__iterate__();
  var len = vals.length();
  for (var i = 0; i < len; ++i) {
    val = vals.get(i);
    if (fn(val, i)) return true;
  }
  return false;
};

/**
 * Count the number of times `fn(val, i)` returns true.
 *
 *    var n = pets.count(function(pet){
 *      return pet.species == 'ferret'
 *    })
 *
 * @param {Function} fn
 * @return {Number}
 * @api public
 */

proto.count = function(fn){
  var val;
  var vals = this.__iterate__();
  var len = vals.length();
  var n = 0;
  for (var i = 0; i < len; ++i) {
    val = vals.get(i);
    if (fn(val, i)) ++n;
  }
  return n;
};

/**
 * Determine the indexof `obj` or return `-1`.
 *
 * @param {Mixed} obj
 * @return {Number}
 * @api public
 */

proto.indexOf = function(obj){
  var val;
  var vals = this.__iterate__();
  var len = vals.length();
  for (var i = 0; i < len; ++i) {
    val = vals.get(i);
    if (val === obj) return i;
  }
  return -1;
};

/**
 * Check if `obj` is present in this enumerable.
 *
 * @param {Mixed} obj
 * @return {Boolean}
 * @api public
 */

proto.has = function(obj){
  return !! ~this.indexOf(obj);
};

/**
 * Reduce with `fn(accumulator, val, i)` using
 * optional `init` value defaulting to the first
 * enumerable value.
 *
 * @param {Function} fn
 * @param {Mixed} [val]
 * @return {Mixed}
 * @api public
 */

proto.reduce = function(fn, init){
  var val;
  var i = 0;
  var vals = this.__iterate__();
  var len = vals.length();

  val = null == init
    ? vals.get(i++)
    : init;

  for (; i < len; ++i) {
    val = fn(val, vals.get(i), i);
  }

  return val;
};

/**
 * Determine the max value.
 *
 * With a callback function:
 *
 *    pets.max(function(pet){
 *      return pet.age
 *    })
 *
 * With property strings:
 *
 *    pets.max('age')
 *
 * With immediate values:
 *
 *    nums.max()
 *
 * @param {Function|String} fn
 * @return {Number}
 * @api public
 */

proto.max = function(fn){
  var val;
  var n = 0;
  var max = -Infinity;
  var vals = this.__iterate__();
  var len = vals.length();

  if (fn) {
    fn = toFunction(fn);
    for (var i = 0; i < len; ++i) {
      n = fn(vals.get(i), i);
      max = n > max ? n : max;
    }
  } else {
    for (var i = 0; i < len; ++i) {
      n = vals.get(i);
      max = n > max ? n : max;
    }
  }

  return max;
};

/**
 * Determine the min value.
 *
 * With a callback function:
 *
 *    pets.min(function(pet){
 *      return pet.age
 *    })
 *
 * With property strings:
 *
 *    pets.min('age')
 *
 * With immediate values:
 *
 *    nums.min()
 *
 * @param {Function|String} fn
 * @return {Number}
 * @api public
 */

proto.min = function(fn){
  var val;
  var n = 0;
  var min = Infinity;
  var vals = this.__iterate__();
  var len = vals.length();

  if (fn) {
    fn = toFunction(fn);
    for (var i = 0; i < len; ++i) {
      n = fn(vals.get(i), i);
      min = n < min ? n : min;
    }
  } else {
    for (var i = 0; i < len; ++i) {
      n = vals.get(i);
      min = n < min ? n : min;
    }
  }

  return min;
};

/**
 * Determine the sum.
 *
 * With a callback function:
 *
 *    pets.sum(function(pet){
 *      return pet.age
 *    })
 *
 * With property strings:
 *
 *    pets.sum('age')
 *
 * With immediate values:
 *
 *    nums.sum()
 *
 * @param {Function|String} fn
 * @return {Number}
 * @api public
 */

proto.sum = function(fn){
  var ret;
  var n = 0;
  var vals = this.__iterate__();
  var len = vals.length();

  if (fn) {
    fn = toFunction(fn);
    for (var i = 0; i < len; ++i) {
      n += fn(vals.get(i), i);
    }
  } else {
    for (var i = 0; i < len; ++i) {
      n += vals.get(i);
    }
  }

  return n;
};

/**
 * Determine the average value.
 *
 * With a callback function:
 *
 *    pets.avg(function(pet){
 *      return pet.age
 *    })
 *
 * With property strings:
 *
 *    pets.avg('age')
 *
 * With immediate values:
 *
 *    nums.avg()
 *
 * @param {Function|String} fn
 * @return {Number}
 * @api public
 */

proto.avg =
proto.mean = function(fn){
  var ret;
  var n = 0;
  var vals = this.__iterate__();
  var len = vals.length();

  if (fn) {
    fn = toFunction(fn);
    for (var i = 0; i < len; ++i) {
      n += fn(vals.get(i), i);
    }
  } else {
    for (var i = 0; i < len; ++i) {
      n += vals.get(i);
    }
  }

  return n / len;
};

/**
 * Return the first value, or first `n` values.
 *
 * @param {Number|Function} [n]
 * @return {Array|Mixed}
 * @api public
 */

proto.first = function(n){
  if ('function' == typeof n) return this.find(n);
  var vals = this.__iterate__();

  if (n) {
    var len = Math.min(n, vals.length());
    var arr = new Array(len);
    for (var i = 0; i < len; ++i) {
      arr[i] = vals.get(i);
    }
    return arr;
  }

  return vals.get(0);
};

/**
 * Return the last value, or last `n` values.
 *
 * @param {Number|Function} [n]
 * @return {Array|Mixed}
 * @api public
 */

proto.last = function(n){
  if ('function' == typeof n) return this.findLast(n);
  var vals = this.__iterate__();
  var len = vals.length();

  if (n) {
    var i = Math.max(0, len - n);
    var arr = [];
    for (; i < len; ++i) {
      arr.push(vals.get(i));
    }
    return arr;
  }

  return vals.get(len - 1);
};

/**
 * Return values in groups of `n`.
 *
 * @param {Number} n
 * @return {Enumerable}
 * @api public
 */

proto.inGroupsOf = function(n){
  var arr = [];
  var group = [];
  var vals = this.__iterate__();
  var len = vals.length();

  for (var i = 0; i < len; ++i) {
    group.push(vals.get(i));
    if ((i + 1) % n == 0) {
      arr.push(group);
      group = [];
    }
  }

  if (group.length) arr.push(group);

  return new Enumerable(arr);
};

/**
 * Return the value at the given index.
 *
 * @param {Number} i
 * @return {Mixed}
 * @api public
 */

proto.at = function(i){
  return this.__iterate__().get(i);
};

/**
 * Return a regular `Array`.
 *
 * @return {Array}
 * @api public
 */

proto.toJSON =
proto.array = function(){
  var arr = [];
  var vals = this.__iterate__();
  var len = vals.length();
  for (var i = 0; i < len; ++i) {
    arr.push(vals.get(i));
  }
  return arr;
};

/**
 * Return the enumerable value.
 *
 * @return {Mixed}
 * @api public
 */

proto.value = function(){
  return this.obj;
};

/**
 * Mixin enumerable.
 */

mixin(Enumerable.prototype);

});
require.register("component-collection/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var Enumerable = require('enumerable');

/**
 * Expose `Collection`.
 */

module.exports = Collection;

/**
 * Initialize a new collection with the given `models`.
 *
 * @param {Array} models
 * @api public
 */

function Collection(models) {
  this.models = models || [];
}

/**
 * Mixin enumerable.
 */

Enumerable(Collection.prototype);

/**
 * Iterator implementation.
 */

Collection.prototype.__iterate__ = function(){
  var self = this;
  return {
    length: function(){ return self.length() },
    get: function(i){ return self.models[i] }
  }
};

/**
 * Return the collection length.
 *
 * @return {Number}
 * @api public
 */

Collection.prototype.length = function(){
  return this.models.length;
};

/**
 * Add `model` to the collection and return the index.
 *
 * @param {Object} model
 * @return {Number}
 * @api public
 */

Collection.prototype.push = function(model){
  return this.models.push(model);
};

});
require.register("component-model/lib/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var proto = require('./proto');
var statics = require('./static');
var Emitter = require('emitter');

/**
 * Expose `createModel`.
 */

module.exports = createModel;

/**
 * Create a new model constructor with the given `name`.
 *
 * @param {String} name
 * @return {Function}
 * @api public
 */

function createModel(name) {
  if ('string' != typeof name) throw new TypeError('model name required');

  /**
   * Initialize a new model with the given `attrs`.
   *
   * @param {Object} attrs
   * @api public
   */

  function model(attrs) {
    if (!(this instanceof model)) return new model(attrs);
    attrs = attrs || {};
    this._callbacks = {};
    this.attrs = attrs;
    this.dirty = attrs;
    this.model.emit('construct', this, attrs);
  }

  // mixin emitter

  Emitter(model);

  // statics

  model.modelName = name;
  model._base = '/' + name.toLowerCase() + 's';
  model.attrs = {};
  model.validators = [];
  model._headers = {};
  for (var key in statics) model[key] = statics[key];

  // prototype

  model.prototype = {};
  model.prototype.model = model;
  for (var key in proto) model.prototype[key] = proto[key];

  return model;
}


});
require.register("component-model/lib/static.js", function(exports, require, module){
/**
 * Module dependencies.
 */

var Collection = require('collection');
var request = require('superagent');
var noop = function(){};

/**
 * Expose request for configuration
 */

exports.request = request;

/**
 * Construct a url to the given `path`.
 *
 * Example:
 *
 *    User.url('add')
 *    // => "/users/add"
 *
 * @param {String} path
 * @return {String}
 * @api public
 */

exports.url = function(path){
  var url = this._base;
  if (0 == arguments.length) return url;
  return url + '/' + path;
};

/**
 * Set base path for urls.
 * Note this is defaulted to '/' + modelName.toLowerCase() + 's'
 *
 * Example:
 *
 *   User.route('/api/u')
 *
 * @param {String} path 
 * @return {Function} self
 * @api public
 */

exports.route = function(path){
  this._base = path;
  return this;
}

/**
 * Add custom http headers to all requests.
 *
 * Example:
 *
 *   User.headers({
 *    'X-CSRF-Token': 'some token',
 *    'X-API-Token': 'api token 
 *   });
 *
 * @param {String|Object} header(s)
 * @param {String} value
 * @return {Function} self
 * @api public
 */

exports.headers = function(headers){
  for(var i in headers){
    this._headers[i] = headers[i];
  }
  return this;
};

/**
 * Add validation `fn()`.
 *
 * @param {Function} fn
 * @return {Function} self
 * @api public
 */

exports.validate = function(fn){
  this.validators.push(fn);
  return this;
};

/**
 * Use the given plugin `fn()`.
 *
 * @param {Function} fn
 * @return {Function} self
 * @api public
 */

exports.use = function(fn){
  fn(this);
  return this;
};

/**
 * Define attr with the given `name` and `options`.
 *
 * @param {String} name
 * @param {Object} options
 * @return {Function} self
 * @api public
 */

exports.attr = function(name, options){
  this.attrs[name] = options || {};

  // implied pk
  if ('_id' == name || 'id' == name) {
    this.attrs[name].primaryKey = true;
    this.primaryKey = name;
  }

  // getter / setter method
  this.prototype[name] = function(val){
    if (0 == arguments.length) return this.attrs[name];
    var prev = this.attrs[name];
    this.dirty[name] = val;
    this.attrs[name] = val;
    this.model.emit('change', this, name, val, prev);
    this.model.emit('change ' + name, this, val, prev);
    this.emit('change', name, val, prev);
    this.emit('change ' + name, val, prev);
    return this;
  };

  return this;
};

/**
 * Remove all and invoke `fn(err)`.
 *
 * @param {Function} [fn]
 * @api public
 */

exports.destroyAll = function(fn){
  fn = fn || noop;
  var self = this;
  var url = this.url('');
  this.request
    .del(url)
    .set(this._headers)
    .end(function(res){
      if (res.error) return fn(error(res), null, res);
      fn(null, [], res);
    });
};

/**
 * Get all and invoke `fn(err, array)`.
 *
 * @param {Function} fn
 * @api public
 */

exports.all = function(fn){
  var self = this;
  var url = this.url('');
  this.request
    .get(url)
    .set(this._headers)
    .end(function(res){
      if (res.error) return fn(error(res), null, res);
      var col = new Collection;
      for (var i = 0, len = res.body.length; i < len; ++i) {
        col.push(new self(res.body[i]));
      }
      fn(null, col, res);
    });
};

/**
 * Get `id` and invoke `fn(err, model)`.
 *
 * @param {Mixed} id
 * @param {Function} fn
 * @api public
 */

exports.get = function(id, fn){
  var self = this;
  var url = this.url(id);
  this.request
    .get(url)
    .set(this._headers)
    .end(function(res){
      if (res.error) return fn(error(res), null, res);
      var model = new self(res.body);
      fn(null, model, res);
    });
};

/**
 * Response error helper.
 *
 * @param {Response} er
 * @return {Error}
 * @api private
 */

function error(res) {
  return new Error('got ' + res.status + ' response');
}

});
require.register("component-model/lib/proto.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var Emitter = require('emitter');
var request = require('superagent');
var each = require('each');
var noop = function(){};

/**
 * Mixin emitter.
 */

Emitter(exports);

/**
 * Expose request for configuration
 */
exports.request = request;

/**
 * Register an error `msg` on `attr`.
 *
 * @param {String} attr
 * @param {String} msg
 * @return {Object} self
 * @api public
 */

exports.error = function(attr, msg){
  this.errors.push({
    attr: attr,
    message: msg
  });
  return this;
};

/**
 * Check if this model is new.
 *
 * @return {Boolean}
 * @api public
 */

exports.isNew = function(){
  var key = this.model.primaryKey;
  return ! this.has(key);
};

/**
 * Get / set the primary key.
 *
 * @param {Mixed} val
 * @return {Mixed}
 * @api public
 */

exports.primary = function(val){
  var key = this.model.primaryKey;
  if (0 == arguments.length) return this[key]();
  return this[key](val);
};

/**
 * Validate the model and return a boolean.
 *
 * Example:
 *
 *    user.isValid()
 *    // => false
 *
 *    user.errors
 *    // => [{ attr: ..., message: ... }]
 *
 * @return {Boolean}
 * @api public
 */

exports.isValid = function(){
  this.validate();
  return 0 == this.errors.length;
};

/**
 * Return `false` or an object
 * containing the "dirty" attributes.
 *
 * Optionally check for a specific `attr`.
 *
 * @param {String} [attr]
 * @return {Object|Boolean}
 * @api public
 */

exports.changed = function(attr){
  var dirty = this.dirty;
  if (Object.keys(dirty).length) {
    if (attr) return !! dirty[attr];
    return dirty;
  }
  return false;
};

/**
 * Perform validations.
 *
 * @api private
 */

exports.validate = function(){
  var self = this;
  var fns = this.model.validators;
  this.errors = [];
  each(fns, function(fn){ fn(self) });
};

/**
 * Destroy the model and mark it as `.destroyed`
 * and invoke `fn(err)`.
 *
 * Events:
 *
 *  - `destroying` before deletion
 *  - `destroy` on deletion
 *
 * @param {Function} [fn]
 * @api public
 */

exports.destroy = function(fn){
  fn = fn || noop;
  if (this.isNew()) return fn(new Error('not saved'));
  var self = this;
  var url = this.url();
  this.model.emit('destroying', this);
  this.emit('destroying');
  this.request
    .del(url)
    .set(this.model._headers)
    .end(function(res){
      if (res.error) return fn(error(res), res);
      self.destroyed = true;
      self.model.emit('destroy', self, res);
      self.emit('destroy');
      fn(null, res);
    });
};

/**
 * Save and invoke `fn(err)`.
 *
 * Events:
 *
 *  - `saving` pre-update or save, after validation
 *  - `save` on updates and saves
 *
 * @param {Function} [fn]
 * @api public
 */

exports.save = function(fn){
  if (!this.isNew()) return this.update(fn);
  var self = this;
  var url = this.model.url();
  var key = this.model.primaryKey;
  fn = fn || noop;
  if (!this.isValid()) return fn(new Error('validation failed'));
  this.model.emit('saving', this);
  this.emit('saving');
  this.request
    .post(url)
    .set(this.model._headers)
    .send(self)
    .end(function(res){
      if (res.error) return fn(error(res), res);
      if (res.body) self.primary(res.body[key]);
      self.dirty = {};
      self.model.emit('save', self, res);
      self.emit('save');
      fn(null, res);
    });
};

/**
 * Update and invoke `fn(err)`.
 *
 * @param {Function} [fn]
 * @api private
 */

exports.update = function(fn){
  var self = this;
  var url = this.url();
  fn = fn || noop;
  if (!this.isValid()) return fn(new Error('validation failed'));
  this.model.emit('saving', this);
  this.emit('saving');
  this.request
    .put(url)
    .set(this.model._headers)
    .send(self)
    .end(function(res){
      if (res.error) return fn(error(res), res);
      self.dirty = {};
      self.model.emit('save', self, res);
      self.emit('save');
      fn(null, res);
    });
};

/**
 * Return a url for `path` relative to this model.
 *
 * Example:
 *
 *    var user = new User({ id: 5 });
 *    user.url('edit');
 *    // => "/users/5/edit"
 *
 * @param {String} path
 * @return {String}
 * @api public
 */

exports.url = function(path){
  var model = this.model;
  var url = model._base;
  var id = this.primary();
  if (0 == arguments.length) return url + '/' + id;
  return url + '/' + id + '/' + path;
};

/**
 * Set multiple `attrs`.
 *
 * @param {Object} attrs
 * @return {Object} self
 * @api public
 */

exports.set = function(attrs){
  for (var key in attrs) {
    this[key](attrs[key]);
  }
  return this;
};

/**
 * Get `attr` value.
 *
 * @param {String} attr
 * @return {Mixed}
 * @api public
 */

exports.get = function(attr){
  return this.attrs[attr];
};

/**
 * Check if `attr` is present (not `null` or `undefined`).
 *
 * @param {String} attr
 * @return {Boolean}
 * @api public
 */

exports.has = function(attr){
  return null != this.attrs[attr];
};

/**
 * Return the JSON representation of the model.
 *
 * @return {Object}
 * @api public
 */

exports.toJSON = function(){
  return this.attrs;
};

/**
 * Response error helper.
 *
 * @param {Response} er
 * @return {Error}
 * @api private
 */

function error(res) {
  return new Error('got ' + res.status + ' response');
}

});
require.register("heavyk-format/index.js", function(exports, require, module){
//
// format, printf-like string formatting for JavaScript
// github.com/samsonjs/format
//
// Copyright 2010 - 2011 Sami Samhuri <sami@samhuri.net>
// ISC license
//

exports.printf = function(/* ... */) {
    console.log(exports.format.apply(this, arguments));
};

exports.format = function(format) {
    var argIndex = 1 // skip initial format argument
      , args = [].slice.call(arguments)
      , i = 0
      , n = format.length
      , result = ''
      , c
      , escaped = false
      , arg
      , precision
      , nextArg = function() { return args[argIndex++]; }
      , slurpNumber = function() {
              var digits = '';
              while (format[i].match(/\d/))
                  digits += format[i++];
              return digits.length > 0 ? parseInt(digits) : null;
          }
      ;
    for (; i < n; ++i) {
        c = format[i];
        if (escaped) {
            escaped = false;
            precision = slurpNumber();
            switch (c) {
            case 'b': // number in binary
                result += parseInt(nextArg(), 10).toString(2);
                break;
            case 'c': // character
                arg = nextArg();
                if (typeof arg === 'string' || arg instanceof String)
                    result += arg;
                else
                    result += String.fromCharCode(parseInt(arg, 10));
                break;
            case 'd': // number in decimal
                result += parseInt(nextArg(), 10);
                break;
            case 'f': // floating point number
                result += parseFloat(nextArg()).toFixed(precision || 6);
                break;
            case 'o': // number in octal
                result += '0' + parseInt(nextArg(), 10).toString(8);
                break;
            case 's': // string
                result += nextArg();
                break;
            case 'x': // lowercase hexadecimal
                result += '0x' + parseInt(nextArg(), 10).toString(16);
                break;
            case 'X': // uppercase hexadecimal
                result += '0x' + parseInt(nextArg(), 10).toString(16).toUpperCase();
                break;
            default:
                result += c;
                break;
            }
        } else if (c === '%') {
            escaped = true;
        } else {
            result += c;
        }
    }
    return result;
};

exports.vsprintf = function(format, replacements) {
    return exports.format.apply(this, [format].concat(replacements));
};

exports.sprintf = exports.format;

});
require.register("visionmedia-page.js/index.js", function(exports, require, module){

;(function(){

  /**
   * Perform initial dispatch.
   */

  var dispatch = true;

  /**
   * Base path.
   */

  var base = '';

  /**
   * Running flag.
   */

  var running;

  /**
   * Register `path` with callback `fn()`,
   * or route `path`, or `page.start()`.
   *
   *   page(fn);
   *   page('*', fn);
   *   page('/user/:id', load, user);
   *   page('/user/' + user.id, { some: 'thing' });
   *   page('/user/' + user.id);
   *   page();
   *
   * @param {String|Function} path
   * @param {Function} fn...
   * @api public
   */

  function page(path, fn) {
    // <callback>
    if ('function' == typeof path) {
      return page('*', path);
    }

    // route <path> to <callback ...>
    if ('function' == typeof fn) {
      var route = new Route(path);
      for (var i = 1; i < arguments.length; ++i) {
        page.callbacks.push(route.middleware(arguments[i]));
      }
    // show <path> with [state]
    } else if ('string' == typeof path) {
      page.show(path, fn);
    // start [options]
    } else {
      page.start(path);
    }
  }

  /**
   * Callback functions.
   */

  page.callbacks = [];

  /**
   * Get or set basepath to `path`.
   *
   * @param {String} path
   * @api public
   */

  page.base = function(path){
    if (0 == arguments.length) return base;
    base = path;
  };

  /**
   * Bind with the given `options`.
   *
   * Options:
   *
   *    - `click` bind to click events [true]
   *    - `popstate` bind to popstate [true]
   *    - `dispatch` perform initial dispatch [true]
   *
   * @param {Object} options
   * @api public
   */

  page.start = function(options){
    options = options || {};
    if (running) return;
    running = true;
    if (false === options.dispatch) dispatch = false;
    if (false !== options.popstate) window.addEventListener('popstate', onpopstate, false);
    if (false !== options.click) window.addEventListener('click', onclick, false);
    if (!dispatch) return;
    var url = location.pathname + location.search + location.hash;
    page.replace(url, null, true, dispatch);
  };

  /**
   * Unbind click and popstate event handlers.
   *
   * @api public
   */

  page.stop = function(){
    running = false;
    removeEventListener('click', onclick, false);
    removeEventListener('popstate', onpopstate, false);
  };

  /**
   * Show `path` with optional `state` object.
   *
   * @param {String} path
   * @param {Object} state
   * @param {Boolean} dispatch
   * @return {Context}
   * @api public
   */

  page.show = function(path, state, dispatch){
    var ctx = new Context(path, state);
    if (false !== dispatch) page.dispatch(ctx);
    if (!ctx.unhandled) ctx.pushState();
    return ctx;
  };

  /**
   * Replace `path` with optional `state` object.
   *
   * @param {String} path
   * @param {Object} state
   * @return {Context}
   * @api public
   */

  page.replace = function(path, state, init, dispatch){
    var ctx = new Context(path, state);
    ctx.init = init;
    if (null == dispatch) dispatch = true;
    if (dispatch) page.dispatch(ctx);
    ctx.save();
    return ctx;
  };

  /**
   * Dispatch the given `ctx`.
   *
   * @param {Object} ctx
   * @api private
   */

  page.dispatch = function(ctx){
    var i = 0;

    function next() {
      var fn = page.callbacks[i++];
      if (!fn) return unhandled(ctx);
      fn(ctx, next);
    }

    next();
  };

  /**
   * Unhandled `ctx`. When it's not the initial
   * popstate then redirect. If you wish to handle
   * 404s on your own use `page('*', callback)`.
   *
   * @param {Context} ctx
   * @api private
   */

  function unhandled(ctx) {
    var current = window.location.pathname + window.location.search;
    if (current == ctx.canonicalPath) return;
    page.stop();
    ctx.unhandled = true;
    window.location = ctx.canonicalPath;
  }

  /**
   * Initialize a new "request" `Context`
   * with the given `path` and optional initial `state`.
   *
   * @param {String} path
   * @param {Object} state
   * @api public
   */

  function Context(path, state) {
    if ('/' == path[0] && 0 != path.indexOf(base)) path = base + path;
    var i = path.indexOf('?');

    this.canonicalPath = path;
    this.path = path.replace(base, '') || '/';

    this.title = document.title;
    this.state = state || {};
    this.state.path = path;
    this.querystring = ~i ? path.slice(i + 1) : '';
    this.pathname = ~i ? path.slice(0, i) : path;
    this.params = [];

    // fragment
    this.hash = '';
    if (!~this.path.indexOf('#')) return;
    var parts = this.path.split('#');
    this.path = parts[0];
    this.hash = parts[1] || '';
    this.querystring = this.querystring.split('#')[0];
  }

  /**
   * Expose `Context`.
   */

  page.Context = Context;

  /**
   * Push state.
   *
   * @api private
   */

  Context.prototype.pushState = function(){
    history.pushState(this.state, this.title, this.canonicalPath);
  };

  /**
   * Save the context state.
   *
   * @api public
   */

  Context.prototype.save = function(){
    history.replaceState(this.state, this.title, this.canonicalPath);
  };

  /**
   * Initialize `Route` with the given HTTP `path`,
   * and an array of `callbacks` and `options`.
   *
   * Options:
   *
   *   - `sensitive`    enable case-sensitive routes
   *   - `strict`       enable strict matching for trailing slashes
   *
   * @param {String} path
   * @param {Object} options.
   * @api private
   */

  function Route(path, options) {
    options = options || {};
    this.path = path;
    this.method = 'GET';
    this.regexp = pathtoRegexp(path
      , this.keys = []
      , options.sensitive
      , options.strict);
  }

  /**
   * Expose `Route`.
   */

  page.Route = Route;

  /**
   * Return route middleware with
   * the given callback `fn()`.
   *
   * @param {Function} fn
   * @return {Function}
   * @api public
   */

  Route.prototype.middleware = function(fn){
    var self = this;
    return function(ctx, next){
      if (self.match(ctx.path, ctx.params)) return fn(ctx, next);
      next();
    };
  };

  /**
   * Check if this route matches `path`, if so
   * populate `params`.
   *
   * @param {String} path
   * @param {Array} params
   * @return {Boolean}
   * @api private
   */

  Route.prototype.match = function(path, params){
    var keys = this.keys
      , qsIndex = path.indexOf('?')
      , pathname = ~qsIndex ? path.slice(0, qsIndex) : path
      , m = this.regexp.exec(pathname);

    if (!m) return false;

    for (var i = 1, len = m.length; i < len; ++i) {
      var key = keys[i - 1];

      var val = 'string' == typeof m[i]
        ? decodeURIComponent(m[i])
        : m[i];

      if (key) {
        params[key.name] = undefined !== params[key.name]
          ? params[key.name]
          : val;
      } else {
        params.push(val);
      }
    }

    return true;
  };

  /**
   * Normalize the given path string,
   * returning a regular expression.
   *
   * An empty array should be passed,
   * which will contain the placeholder
   * key names. For example "/user/:id" will
   * then contain ["id"].
   *
   * @param  {String|RegExp|Array} path
   * @param  {Array} keys
   * @param  {Boolean} sensitive
   * @param  {Boolean} strict
   * @return {RegExp}
   * @api private
   */

  function pathtoRegexp(path, keys, sensitive, strict) {
    if (path instanceof RegExp) return path;
    if (path instanceof Array) path = '(' + path.join('|') + ')';
    path = path
      .concat(strict ? '' : '/?')
      .replace(/\/\(/g, '(?:/')
      .replace(/(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?/g, function(_, slash, format, key, capture, optional){
        keys.push({ name: key, optional: !! optional });
        slash = slash || '';
        return ''
          + (optional ? '' : slash)
          + '(?:'
          + (optional ? slash : '')
          + (format || '') + (capture || (format && '([^/.]+?)' || '([^/]+?)')) + ')'
          + (optional || '');
      })
      .replace(/([\/.])/g, '\\$1')
      .replace(/\*/g, '(.*)');
    return new RegExp('^' + path + '$', sensitive ? '' : 'i');
  }

  /**
   * Handle "populate" events.
   */

  function onpopstate(e) {
    if (e.state) {
      var path = e.state.path;
      page.replace(path, e.state);
    }
  }

  /**
   * Handle "click" events.
   */

  function onclick(e) {
    if (1 != which(e)) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    if (e.defaultPrevented) return;

    // ensure link
    var el = e.target;
    while (el && 'A' != el.nodeName) el = el.parentNode;
    if (!el || 'A' != el.nodeName) return;

    // ensure non-hash for the same path
    var link = el.getAttribute('href');
    if (el.pathname == location.pathname && (el.hash || '#' == link)) return;

    // check target
    if (el.target) return;

    // x-origin
    if (!sameOrigin(el.href)) return;

    // rebuild path
    var path = el.pathname + el.search + (el.hash || '');

    // same page
    var orig = path + el.hash;

    path = path.replace(base, '');
    if (base && orig == path) return;

    e.preventDefault();
    page.show(orig);
  }

  /**
   * Event button.
   */

  function which(e) {
    e = e || window.event;
    return null == e.which
      ? e.button
      : e.which;
  }

  /**
   * Check if `href` is the same origin.
   */

  function sameOrigin(href) {
    var origin = location.protocol + '//' + location.hostname;
    if (location.port) origin += ':' + location.port;
    return 0 == href.indexOf(origin);
  }

  /**
   * Expose `page`.
   */

  if ('undefined' == typeof module) {
    window.page = page;
  } else {
    module.exports = page;
  }

})();

});
require.register("RedVentures-reduce/index.js", function(exports, require, module){

/**
 * Reduce `arr` with `fn`.
 *
 * @param {Array} arr
 * @param {Function} fn
 * @param {Mixed} initial
 *
 * TODO: combatible error handling?
 */

module.exports = function(arr, fn, initial){  
  var idx = 0;
  var len = arr.length;
  var curr = arguments.length == 3
    ? initial
    : arr[idx++];

  while (idx < len) {
    curr = fn.call(null, curr, arr[idx], ++idx, arr);
  }
  
  return curr;
};
});
require.register("visionmedia-superagent/lib/client.js", function(exports, require, module){
/**
 * Module dependencies.
 */

var Emitter = require('emitter');
var reduce = require('reduce');

/**
 * Root reference for iframes.
 */

var root = 'undefined' == typeof window
  ? this
  : window;

/**
 * Noop.
 */

function noop(){};

/**
 * Check if `obj` is a host object,
 * we don't want to serialize these :)
 *
 * TODO: future proof, move to compoent land
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */

function isHost(obj) {
  var str = {}.toString.call(obj);

  switch (str) {
    case '[object File]':
    case '[object Blob]':
    case '[object FormData]':
      return true;
    default:
      return false;
  }
}

/**
 * Determine XHR.
 */

function getXHR() {
  if (root.XMLHttpRequest
    && ('file:' != root.location.protocol || !root.ActiveXObject)) {
    return new XMLHttpRequest;
  } else {
    try { return new ActiveXObject('Microsoft.XMLHTTP'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP.6.0'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP.3.0'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP'); } catch(e) {}
  }
  return false;
}

/**
 * Removes leading and trailing whitespace, added to support IE.
 *
 * @param {String} s
 * @return {String}
 * @api private
 */

var trim = ''.trim
  ? function(s) { return s.trim(); }
  : function(s) { return s.replace(/(^\s*|\s*$)/g, ''); };

/**
 * Check if `obj` is an object.
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */

function isObject(obj) {
  return obj === Object(obj);
}

/**
 * Serialize the given `obj`.
 *
 * @param {Object} obj
 * @return {String}
 * @api private
 */

function serialize(obj) {
  if (!isObject(obj)) return obj;
  var pairs = [];
  for (var key in obj) {
    pairs.push(encodeURIComponent(key)
      + '=' + encodeURIComponent(obj[key]));
  }
  return pairs.join('&');
}

/**
 * Expose serialization method.
 */

 request.serializeObject = serialize;

 /**
  * Parse the given x-www-form-urlencoded `str`.
  *
  * @param {String} str
  * @return {Object}
  * @api private
  */

function parseString(str) {
  var obj = {};
  var pairs = str.split('&');
  var parts;
  var pair;

  for (var i = 0, len = pairs.length; i < len; ++i) {
    pair = pairs[i];
    parts = pair.split('=');
    obj[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
  }

  return obj;
}

/**
 * Expose parser.
 */

request.parseString = parseString;

/**
 * Default MIME type map.
 *
 *     superagent.types.xml = 'application/xml';
 *
 */

request.types = {
  html: 'text/html',
  json: 'application/json',
  urlencoded: 'application/x-www-form-urlencoded',
  'form': 'application/x-www-form-urlencoded',
  'form-data': 'application/x-www-form-urlencoded'
};

/**
 * Default serialization map.
 *
 *     superagent.serialize['application/xml'] = function(obj){
 *       return 'generated xml here';
 *     };
 *
 */

 request.serialize = {
   'application/x-www-form-urlencoded': serialize,
   'application/json': JSON.stringify
 };

 /**
  * Default parsers.
  *
  *     superagent.parse['application/xml'] = function(str){
  *       return { object parsed from str };
  *     };
  *
  */

request.parse = {
  'application/x-www-form-urlencoded': parseString,
  'application/json': JSON.parse
};

/**
 * Parse the given header `str` into
 * an object containing the mapped fields.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

function parseHeader(str) {
  var lines = str.split(/\r?\n/);
  var fields = {};
  var index;
  var line;
  var field;
  var val;

  lines.pop(); // trailing CRLF

  for (var i = 0, len = lines.length; i < len; ++i) {
    line = lines[i];
    index = line.indexOf(':');
    field = line.slice(0, index).toLowerCase();
    val = trim(line.slice(index + 1));
    fields[field] = val;
  }

  return fields;
}

/**
 * Return the mime type for the given `str`.
 *
 * @param {String} str
 * @return {String}
 * @api private
 */

function type(str){
  return str.split(/ *; */).shift();
};

/**
 * Return header field parameters.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

function params(str){
  return reduce(str.split(/ *; */), function(obj, str){
    var parts = str.split(/ *= */)
      , key = parts.shift()
      , val = parts.shift();

    if (key && val) obj[key] = val;
    return obj;
  }, {});
};

/**
 * Initialize a new `Response` with the given `xhr`.
 *
 *  - set flags (.ok, .error, etc)
 *  - parse header
 *
 * Examples:
 *
 *  Aliasing `superagent` as `request` is nice:
 *
 *      request = superagent;
 *
 *  We can use the promise-like API, or pass callbacks:
 *
 *      request.get('/').end(function(res){});
 *      request.get('/', function(res){});
 *
 *  Sending data can be chained:
 *
 *      request
 *        .post('/user')
 *        .send({ name: 'tj' })
 *        .end(function(res){});
 *
 *  Or passed to `.send()`:
 *
 *      request
 *        .post('/user')
 *        .send({ name: 'tj' }, function(res){});
 *
 *  Or passed to `.post()`:
 *
 *      request
 *        .post('/user', { name: 'tj' })
 *        .end(function(res){});
 *
 * Or further reduced to a single call for simple cases:
 *
 *      request
 *        .post('/user', { name: 'tj' }, function(res){});
 *
 * @param {XMLHTTPRequest} xhr
 * @param {Object} options
 * @api private
 */

function Response(req, options) {
  options = options || {};
  this.req = req;
  this.xhr = this.req.xhr;
  this.text = this.xhr.responseText;
  this.setStatusProperties(this.xhr.status);
  this.header = this.headers = parseHeader(this.xhr.getAllResponseHeaders());
  // getAllResponseHeaders sometimes falsely returns "" for CORS requests, but
  // getResponseHeader still works. so we get content-type even if getting
  // other headers fails.
  this.header['content-type'] = this.xhr.getResponseHeader('content-type');
  this.setHeaderProperties(this.header);
  this.body = this.parseBody(this.text);
}

/**
 * Get case-insensitive `field` value.
 *
 * @param {String} field
 * @return {String}
 * @api public
 */

Response.prototype.get = function(field){
  return this.header[field.toLowerCase()];
};

/**
 * Set header related properties:
 *
 *   - `.type` the content type without params
 *
 * A response of "Content-Type: text/plain; charset=utf-8"
 * will provide you with a `.type` of "text/plain".
 *
 * @param {Object} header
 * @api private
 */

Response.prototype.setHeaderProperties = function(header){
  // content-type
  var ct = this.header['content-type'] || '';
  this.type = type(ct);

  // params
  var obj = params(ct);
  for (var key in obj) this[key] = obj[key];
};

/**
 * Parse the given body `str`.
 *
 * Used for auto-parsing of bodies. Parsers
 * are defined on the `superagent.parse` object.
 *
 * @param {String} str
 * @return {Mixed}
 * @api private
 */

Response.prototype.parseBody = function(str){
  var parse = request.parse[this.type];
  return parse
    ? parse(str)
    : null;
};

/**
 * Set flags such as `.ok` based on `status`.
 *
 * For example a 2xx response will give you a `.ok` of __true__
 * whereas 5xx will be __false__ and `.error` will be __true__. The
 * `.clientError` and `.serverError` are also available to be more
 * specific, and `.statusType` is the class of error ranging from 1..5
 * sometimes useful for mapping respond colors etc.
 *
 * "sugar" properties are also defined for common cases. Currently providing:
 *
 *   - .noContent
 *   - .badRequest
 *   - .unauthorized
 *   - .notAcceptable
 *   - .notFound
 *
 * @param {Number} status
 * @api private
 */

Response.prototype.setStatusProperties = function(status){
  var type = status / 100 | 0;

  // status / class
  this.status = status;
  this.statusType = type;

  // basics
  this.info = 1 == type;
  this.ok = 2 == type;
  this.clientError = 4 == type;
  this.serverError = 5 == type;
  this.error = (4 == type || 5 == type)
    ? this.toError()
    : false;

  // sugar
  this.accepted = 202 == status;
  this.noContent = 204 == status || 1223 == status;
  this.badRequest = 400 == status;
  this.unauthorized = 401 == status;
  this.notAcceptable = 406 == status;
  this.notFound = 404 == status;
  this.forbidden = 403 == status;
};

/**
 * Return an `Error` representative of this response.
 *
 * @return {Error}
 * @api public
 */

Response.prototype.toError = function(){
  var req = this.req;
  var method = req.method;
  var path = req.path;

  var msg = 'cannot ' + method + ' ' + path + ' (' + this.status + ')';
  var err = new Error(msg);
  err.status = this.status;
  err.method = method;
  err.path = path;

  return err;
};

/**
 * Expose `Response`.
 */

request.Response = Response;

/**
 * Initialize a new `Request` with the given `method` and `url`.
 *
 * @param {String} method
 * @param {String} url
 * @api public
 */

function Request(method, url) {
  var self = this;
  Emitter.call(this);
  this._query = this._query || [];
  this.method = method;
  this.url = url;
  this.header = {};
  this._header = {};
  this.on('end', function(){
    var res = new Response(self);
    if ('HEAD' == method) res.text = null;
    self.callback(null, res);
  });
}

/**
 * Mixin `Emitter`.
 */

Emitter(Request.prototype);

/**
 * Set timeout to `ms`.
 *
 * @param {Number} ms
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.timeout = function(ms){
  this._timeout = ms;
  return this;
};

/**
 * Clear previous timeout.
 *
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.clearTimeout = function(){
  this._timeout = 0;
  clearTimeout(this._timer);
  return this;
};

/**
 * Abort the request, and clear potential timeout.
 *
 * @return {Request}
 * @api public
 */

Request.prototype.abort = function(){
  if (this.aborted) return;
  this.aborted = true;
  this.xhr.abort();
  this.clearTimeout();
  this.emit('abort');
  return this;
};

/**
 * Set header `field` to `val`, or multiple fields with one object.
 *
 * Examples:
 *
 *      req.get('/')
 *        .set('Accept', 'application/json')
 *        .set('X-API-Key', 'foobar')
 *        .end(callback);
 *
 *      req.get('/')
 *        .set({ Accept: 'application/json', 'X-API-Key': 'foobar' })
 *        .end(callback);
 *
 * @param {String|Object} field
 * @param {String} val
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.set = function(field, val){
  if (isObject(field)) {
    for (var key in field) {
      this.set(key, field[key]);
    }
    return this;
  }
  this._header[field.toLowerCase()] = val;
  this.header[field] = val;
  return this;
};

/**
 * Get case-insensitive header `field` value.
 *
 * @param {String} field
 * @return {String}
 * @api private
 */

Request.prototype.getHeader = function(field){
  return this._header[field.toLowerCase()];
};

/**
 * Set Content-Type to `type`, mapping values from `request.types`.
 *
 * Examples:
 *
 *      superagent.types.xml = 'application/xml';
 *
 *      request.post('/')
 *        .type('xml')
 *        .send(xmlstring)
 *        .end(callback);
 *
 *      request.post('/')
 *        .type('application/xml')
 *        .send(xmlstring)
 *        .end(callback);
 *
 * @param {String} type
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.type = function(type){
  this.set('Content-Type', request.types[type] || type);
  return this;
};

/**
 * Set Authorization field value with `user` and `pass`.
 *
 * @param {String} user
 * @param {String} pass
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.auth = function(user, pass){
  var str = btoa(user + ':' + pass);
  this.set('Authorization', 'Basic ' + str);
  return this;
};

/**
* Add query-string `val`.
*
* Examples:
*
*   request.get('/shoes')
*     .query('size=10')
*     .query({ color: 'blue' })
*
* @param {Object|String} val
* @return {Request} for chaining
* @api public
*/

Request.prototype.query = function(val){
  if ('string' != typeof val) val = serialize(val);
  if (val) this._query.push(val);
  return this;
};

/**
 * Send `data`, defaulting the `.type()` to "json" when
 * an object is given.
 *
 * Examples:
 *
 *       // querystring
 *       request.get('/search')
 *         .end(callback)
 *
 *       // multiple data "writes"
 *       request.get('/search')
 *         .send({ search: 'query' })
 *         .send({ range: '1..5' })
 *         .send({ order: 'desc' })
 *         .end(callback)
 *
 *       // manual json
 *       request.post('/user')
 *         .type('json')
 *         .send('{"name":"tj"})
 *         .end(callback)
 *
 *       // auto json
 *       request.post('/user')
 *         .send({ name: 'tj' })
 *         .end(callback)
 *
 *       // manual x-www-form-urlencoded
 *       request.post('/user')
 *         .type('form')
 *         .send('name=tj')
 *         .end(callback)
 *
 *       // auto x-www-form-urlencoded
 *       request.post('/user')
 *         .type('form')
 *         .send({ name: 'tj' })
 *         .end(callback)
 *
 *       // defaults to x-www-form-urlencoded
  *      request.post('/user')
  *        .send('name=tobi')
  *        .send('species=ferret')
  *        .end(callback)
 *
 * @param {String|Object} data
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.send = function(data){
  var obj = isObject(data);
  var type = this.getHeader('Content-Type');

  // merge
  if (obj && isObject(this._data)) {
    for (var key in data) {
      this._data[key] = data[key];
    }
  } else if ('string' == typeof data) {
    if (!type) this.type('form');
    type = this.getHeader('Content-Type');
    if ('application/x-www-form-urlencoded' == type) {
      this._data = this._data
        ? this._data + '&' + data
        : data;
    } else {
      this._data = (this._data || '') + data;
    }
  } else {
    this._data = data;
  }

  if (!obj) return this;
  if (!type) this.type('json');
  return this;
};

/**
 * Invoke the callback with `err` and `res`
 * and handle arity check.
 *
 * @param {Error} err
 * @param {Response} res
 * @api private
 */

Request.prototype.callback = function(err, res){
  var fn = this._callback;
  if (2 == fn.length) return fn(err, res);
  if (err) return this.emit('error', err);
  fn(res);
};

/**
 * Invoke callback with x-domain error.
 *
 * @api private
 */

Request.prototype.crossDomainError = function(){
  var err = new Error('Origin is not allowed by Access-Control-Allow-Origin');
  err.crossDomain = true;
  this.callback(err);
};

/**
 * Invoke callback with timeout error.
 *
 * @api private
 */

Request.prototype.timeoutError = function(){
  var timeout = this._timeout;
  var err = new Error('timeout of ' + timeout + 'ms exceeded');
  err.timeout = timeout;
  this.callback(err);
};

/**
 * Enable transmission of cookies with x-domain requests.
 *
 * Note that for this to work the origin must not be
 * using "Access-Control-Allow-Origin" with a wildcard,
 * and also must set "Access-Control-Allow-Credentials"
 * to "true".
 *
 * @api public
 */

Request.prototype.withCredentials = function(){
  this._withCredentials = true;
  return this;
};

/**
 * Initiate request, invoking callback `fn(res)`
 * with an instanceof `Response`.
 *
 * @param {Function} fn
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.end = function(fn){
  var self = this;
  var xhr = this.xhr = getXHR();
  var query = this._query.join('&');
  var timeout = this._timeout;
  var data = this._data;

  // store callback
  this._callback = fn || noop;

  // CORS
  if (this._withCredentials) xhr.withCredentials = true;

  // state change
  xhr.onreadystatechange = function(){
    if (4 != xhr.readyState) return;
    if (0 == xhr.status) {
      if (self.aborted) return self.timeoutError();
      return self.crossDomainError();
    }
    self.emit('end');
  };

  // progress
  if (xhr.upload) {
    xhr.upload.onprogress = function(e){
      e.percent = e.loaded / e.total * 100;
      self.emit('progress', e);
    };
  }

  // timeout
  if (timeout && !this._timer) {
    this._timer = setTimeout(function(){
      self.abort();
    }, timeout);
  }

  // querystring
  if (query) {
    query = request.serializeObject(query);
    this.url += ~this.url.indexOf('?')
      ? '&' + query
      : '?' + query;
  }

  // initiate request
  xhr.open(this.method, this.url, true);

  // body
  if ('GET' != this.method && 'HEAD' != this.method && 'string' != typeof data && !isHost(data)) {
    // serialize stuff
    var serialize = request.serialize[this.getHeader('Content-Type')];
    if (serialize) data = serialize(data);
  }

  // set header fields
  for (var field in this.header) {
    if (null == this.header[field]) continue;
    xhr.setRequestHeader(field, this.header[field]);
  }

  // send stuff
  xhr.send(data);
  return this;
};

/**
 * Expose `Request`.
 */

request.Request = Request;

/**
 * Issue a request:
 *
 * Examples:
 *
 *    request('GET', '/users').end(callback)
 *    request('/users').end(callback)
 *    request('/users', callback)
 *
 * @param {String} method
 * @param {String|Function} url or callback
 * @return {Request}
 * @api public
 */

function request(method, url) {
  // callback
  if ('function' == typeof url) {
    return new Request('GET', method).end(url);
  }

  // url first
  if (1 == arguments.length) {
    return new Request('GET', method);
  }

  return new Request(method, url);
}

/**
 * GET `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} data or fn
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.get = function(url, data, fn){
  var req = request('GET', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.query(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * GET `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} data or fn
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.head = function(url, data, fn){
  var req = request('HEAD', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * DELETE `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.del = function(url, fn){
  var req = request('DELETE', url);
  if (fn) req.end(fn);
  return req;
};

/**
 * PATCH `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed} data
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.patch = function(url, data, fn){
  var req = request('PATCH', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * POST `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed} data
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.post = function(url, data, fn){
  var req = request('POST', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * PUT `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} data or fn
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.put = function(url, data, fn){
  var req = request('PUT', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * Expose `request`.
 */

module.exports = request;

});
require.register("component-format-parser/index.js", function(exports, require, module){

/**
 * Parse the given format `str`.
 *
 * @param {String} str
 * @return {Array}
 * @api public
 */

module.exports = function(str){
	return str.split(/ *\| */).map(function(call){
		var parts = call.split(':');
		var name = parts.shift();
		var args = parseArgs(parts.join(':'));

		return {
			name: name,
			args: args
		};
	});
};

/**
 * Parse args `str`.
 *
 * @param {String} str
 * @return {Array}
 * @api private
 */

function parseArgs(str) {
	var args = [];
	var re = /"([^"]*)"|'([^']*)'|([^ \t,]+)/g;
	var m;
	
	while (m = re.exec(str)) {
		args.push(m[2] || m[1] || m[0]);
	}
	
	return args;
}

});
require.register("component-props/index.js", function(exports, require, module){

/**
 * Return immediate identifiers parsed from `str`.
 *
 * @param {String} str
 * @return {Array}
 * @api public
 */

module.exports = function(str, prefix){
  var p = unique(props(str));
  if (prefix) return prefixed(str, p, prefix);
  return p;
};

/**
 * Return immediate identifiers in `str`.
 *
 * @param {String} str
 * @return {Array}
 * @api private
 */

function props(str) {
  return str
    .replace(/\.\w+|\w+ *\(|"[^"]*"|'[^']*'|\/([^/]+)\//g, '')
    .match(/[a-zA-Z_]\w*/g)
    || [];
}

/**
 * Return `str` with `props` prefixed with `prefix`.
 *
 * @param {String} str
 * @param {Array} props
 * @param {String} prefix
 * @return {String}
 * @api private
 */

function prefixed(str, props, prefix) {
  var re = /\.\w+|\w+ *\(|"[^"]*"|'[^']*'|\/([^/]+)\/|[a-zA-Z_]\w*/g;
  return str.replace(re, function(_){
    if ('(' == _[_.length - 1]) return prefix + _;
    if (!~props.indexOf(_)) return _;
    return prefix + _;
  });
}

/**
 * Return unique array.
 *
 * @param {Array} arr
 * @return {Array}
 * @api private
 */

function unique(arr) {
  var ret = [];

  for (var i = 0; i < arr.length; i++) {
    if (~ret.indexOf(arr[i])) continue;
    ret.push(arr[i]);
  }

  return ret;
}

});
require.register("visionmedia-debug/index.js", function(exports, require, module){
if ('undefined' == typeof window) {
  module.exports = require('./lib/debug');
} else {
  module.exports = require('./debug');
}

});
require.register("visionmedia-debug/debug.js", function(exports, require, module){

/**
 * Expose `debug()` as the module.
 */

module.exports = debug;

/**
 * Create a debugger with the given `name`.
 *
 * @param {String} name
 * @return {Type}
 * @api public
 */

function debug(name) {
  if (!debug.enabled(name)) return function(){};

  return function(fmt){
    fmt = coerce(fmt);

    var curr = new Date;
    var ms = curr - (debug[name] || curr);
    debug[name] = curr;

    fmt = name
      + ' '
      + fmt
      + ' +' + debug.humanize(ms);

    // This hackery is required for IE8
    // where `console.log` doesn't have 'apply'
    window.console
      && console.log
      && Function.prototype.apply.call(console.log, console, arguments);
  }
}

/**
 * The currently active debug mode names.
 */

debug.names = [];
debug.skips = [];

/**
 * Enables a debug mode by name. This can include modes
 * separated by a colon and wildcards.
 *
 * @param {String} name
 * @api public
 */

debug.enable = function(name) {
  try {
    localStorage.debug = name;
  } catch(e){}

  var split = (name || '').split(/[\s,]+/)
    , len = split.length;

  for (var i = 0; i < len; i++) {
    name = split[i].replace('*', '.*?');
    if (name[0] === '-') {
      debug.skips.push(new RegExp('^' + name.substr(1) + '$'));
    }
    else {
      debug.names.push(new RegExp('^' + name + '$'));
    }
  }
};

/**
 * Disable debug output.
 *
 * @api public
 */

debug.disable = function(){
  debug.enable('');
};

/**
 * Humanize the given `ms`.
 *
 * @param {Number} m
 * @return {String}
 * @api private
 */

debug.humanize = function(ms) {
  var sec = 1000
    , min = 60 * 1000
    , hour = 60 * min;

  if (ms >= hour) return (ms / hour).toFixed(1) + 'h';
  if (ms >= min) return (ms / min).toFixed(1) + 'm';
  if (ms >= sec) return (ms / sec | 0) + 's';
  return ms + 'ms';
};

/**
 * Returns true if the given mode name is enabled, false otherwise.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */

debug.enabled = function(name) {
  for (var i = 0, len = debug.skips.length; i < len; i++) {
    if (debug.skips[i].test(name)) {
      return false;
    }
  }
  for (var i = 0, len = debug.names.length; i < len; i++) {
    if (debug.names[i].test(name)) {
      return true;
    }
  }
  return false;
};

/**
 * Coerce `val`.
 */

function coerce(val) {
  if (val instanceof Error) return val.stack || val.message;
  return val;
}

// persist

try {
  if (window.localStorage) debug.enable(localStorage.debug);
} catch(e){}

});
require.register("component-reactive/lib/index.js", function(exports, require, module){
/**
 * Module dependencies.
 */

var adapter = require('./adapter');
var AttrBinding = require('./attr-binding');
var TextBinding = require('./text-binding');
var debug = require('debug')('reactive');
var bindings = require('./bindings');
var Binding = require('./binding');
var utils = require('./utils');
var query = require('query');

/**
 * Expose `Reactive`.
 */

exports = module.exports = Reactive;

/**
 * Bindings.
 */

exports.bindings = {};

/**
 * Define subscription function.
 *
 * @param {Function} fn
 * @api public
 */

exports.subscribe = function(fn){
  adapter.subscribe = fn;
};

/**
 * Define unsubscribe function.
 *
 * @param {Function} fn
 * @api public
 */

exports.unsubscribe = function(fn){
  adapter.unsubscribe = fn;
};

/**
 * Define a get function.
 *
 * @param {Function} fn
 * @api public
 */

exports.get = function(fn) {
  adapter.get = fn;
};

/**
 * Define a set function.
 *
 * @param {Function} fn
 * @api public
 */

exports.set = function(fn) {
  adapter.set = fn;
};

/**
 * Expose adapter
 */

exports.adapter = adapter;

/**
 * Define binding `name` with callback `fn(el, val)`.
 *
 * @param {String} name or object
 * @param {String|Object} name
 * @param {Function} fn
 * @api public
 */

exports.bind = function(name, fn){
  if ('object' == typeof name) {
    for (var key in name) {
      exports.bind(key, name[key]);
    }
    return;
  }

  exports.bindings[name] = fn;
};

/**
 * Middleware
 * @param {Function} fn
 * @api public
 */

exports.use = function(fn) {
  fn(exports);
  return this;
};

/**
 * Initialize a reactive template for `el` and `obj`.
 *
 * @param {Element} el
 * @param {Element} obj
 * @param {Object} options
 * @api public
 */

function Reactive(el, model, view) {
  if (!(this instanceof Reactive)) return new Reactive(el, model, view);
  this.adapter = exports.adapter;
  this.el = el;
  this.model = model;
  this.els = [];
  this.view = view || {};
  this.bindAll();
  this.bindInterpolation(this.el, []);
}

/**
 * Subscribe to changes on `prop`.
 *
 * @param {String} prop
 * @param {Function} fn
 * @return {Reactive}
 * @api private
 */

Reactive.prototype.sub = function(prop, fn){
  this.adapter.subscribe(this.model, prop, fn);
  return this;
};

/**
 * Unsubscribe to changes from `prop`.
 *
 * @param {String} prop
 * @param {Function} fn
 * @return {Reactive}
 * @api private
 */

Reactive.prototype.unsub = function(prop, fn){
  this.adapter.unsubscribe(this.model, prop, fn);
  return this;
};

/**
 * Get a `prop`
 *
 * @param {String} prop
 * @param {Mixed} val
 * @return {Mixed}
 * @api private
 */

Reactive.prototype.get = function(prop) {
  return this.adapter.get(this.model, prop);
};

/**
 * Set a `prop`
 *
 * @param {String} prop
 * @param {Mixed} val
 * @return {Reactive}
 * @api private
 */

Reactive.prototype.set = function(prop, val) {
  this.adapter.set(this.model, prop, val);
  return this;
};

/**
 * Traverse and bind all interpolation within attributes and text.
 *
 * @param {Element} el
 * @api private
 */

Reactive.prototype.bindInterpolation = function(el, els){

  // element
  if (el.nodeType == 1) {
    for (var i = 0; i < el.attributes.length; i++) {
      var attr = el.attributes[i];
      if (utils.hasInterpolation(attr.value)) {
        new AttrBinding(this, el, attr);
      }
    }
  }

  // text node
  if (el.nodeType == 3) {
    if (utils.hasInterpolation(el.data)) {
      debug('bind text "%s"', el.data);
      new TextBinding(this, el);
    }
  }

  // walk nodes
  for (var i = 0; i < el.childNodes.length; i++) {
    var node = el.childNodes[i];
    this.bindInterpolation(node, els);
  }
};

/**
 * Apply all bindings.
 *
 * @api private
 */

Reactive.prototype.bindAll = function() {
  for (var name in exports.bindings) {
    this.bind(name, exports.bindings[name]);
  }
};

/**
 * Bind `name` to `fn`.
 *
 * @param {String|Object} name or object
 * @param {Function} fn
 * @api public
 */

Reactive.prototype.bind = function(name, fn) {
  if ('object' == typeof name) {
    for (var key in name) {
      this.bind(key, name[key]);
    }
    return;
  }

  var els = query.all('[' + name + ']', this.el);
  if (this.el.hasAttribute && this.el.hasAttribute(name)) {
    els = [].slice.call(els);
    els.unshift(this.el);
  }
  if (!els.length) return;

  debug('bind [%s] (%d elements)', name, els.length);
  for (var i = 0; i < els.length; i++) {
    var binding = new Binding(name, this, els[i], fn);
    binding.bind();
  }
};

/**
 * Use middleware
 *
 * @api public
 */

Reactive.prototype.use = function(fn) {
  fn(this);
  return this;
};

// bundled bindings

exports.use(bindings);

});
require.register("component-reactive/lib/utils.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var debug = require('debug')('reactive:utils');
var props = require('props');
var adapter = require('./adapter');

/**
 * Function cache.
 */

var cache = {};

/**
 * Return interpolation property names in `str`,
 * for example "{foo} and {bar}" would return
 * ['foo', 'bar'].
 *
 * @param {String} str
 * @return {Array}
 * @api private
 */

exports.interpolationProps = function(str) {
  var m;
  var arr = [];
  var re = /\{([^}]+)\}/g;

  while (m = re.exec(str)) {
    var expr = m[1];
    arr = arr.concat(props(expr));
  }

  return unique(arr);
};

/**
 * Interpolate `str` with the given `fn`.
 *
 * @param {String} str
 * @param {Function} fn
 * @return {String}
 * @api private
 */

exports.interpolate = function(str, fn){
  return str.replace(/\{([^}]+)\}/g, function(_, expr){
    var cb = cache[expr];
    if (!cb) cb = cache[expr] = compile(expr);
    return fn(expr.trim(), cb);
  });
};

/**
 * Check if `str` has interpolation.
 *
 * @param {String} str
 * @return {Boolean}
 * @api private
 */

exports.hasInterpolation = function(str) {
  return ~str.indexOf('{');
};

/**
 * Remove computed properties notation from `str`.
 *
 * @param {String} str
 * @return {String}
 * @api private
 */

exports.clean = function(str) {
  return str.split('<')[0].trim();
};

/**
 * Call `prop` on `model` or `view`.
 *
 * @param {Object} model
 * @param {Object} view
 * @param {String} prop
 * @return {Mixed}
 * @api private
 */

exports.call = function(model, view, prop){
  // view method
  if ('function' == typeof view[prop]) {
    return view[prop]();
  }

  // view value
  if (view.hasOwnProperty(prop)) {
    return view[prop];
  }

  // get property from model
  return adapter.get(model, prop);
};

/**
 * Compile `expr` to a `Function`.
 *
 * @param {String} expr
 * @return {Function}
 * @api private
 */

function compile(expr) {
  // TODO: use props() callback instead
  var re = /\.\w+|\w+ *\(|"[^"]*"|'[^']*'|\/([^/]+)\/|[a-zA-Z_]\w*/g;
  var p = props(expr);

  var body = expr.replace(re, function(_) {
    if ('(' == _[_.length - 1]) return access(_);
    if (!~p.indexOf(_)) return _;
    return call(_);
  });

  debug('compile `%s`', body);
  return new Function('model', 'view', 'call', 'return ' + body);
}

/**
 * Access a method `prop` with dot notation.
 *
 * @param {String} prop
 * @return {String}
 * @api private
 */

function access(prop) {
  return 'model.' + prop;
}

/**
 * Call `prop` on view, model, or access the model's property.
 *
 * @param {String} prop
 * @return {String}
 * @api private
 */

function call(prop) {
  return 'call(model, view, "' + prop + '")';
}

/**
 * Return unique array.
 *
 * @param {Array} arr
 * @return {Array}
 * @api private
 */

function unique(arr) {
  var ret = [];

  for (var i = 0; i < arr.length; i++) {
    if (~ret.indexOf(arr[i])) continue;
    ret.push(arr[i]);
  }

  return ret;
}

});
require.register("component-reactive/lib/text-binding.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var debug = require('debug')('reactive:text-binding');
var utils = require('./utils');

/**
 * Expose `TextBinding`.
 */

module.exports = TextBinding;

/**
 * Initialize a new text binding.
 *
 * @param {Reactive} view
 * @param {Element} node
 * @param {Attribute} attr
 * @api private
 */

function TextBinding(reactive, node) {
  this.reactive = reactive;
  this.text = node.data;
  this.node = node;
  this.props = utils.interpolationProps(this.text);
  this.subscribe();
  this.render();
}

/**
 * Subscribe to changes.
 */

TextBinding.prototype.subscribe = function(){
  var self = this;
  var reactive = this.reactive;
  this.props.forEach(function(prop){
    reactive.sub(prop, function(){
      self.render();
    });
  });
};

/**
 * Render text.
 */

TextBinding.prototype.render = function(){
  var node = this.node;
  var text = this.text;
  var reactive = this.reactive;
  var model = reactive.model;

  // TODO: delegate most of this to `Reactive`
  debug('render "%s"', text);
  node.data = utils.interpolate(text, function(prop, fn){
    if (fn) {
      return fn(model, reactive.view, utils.call);
    } else {
      return reactive.get(model, prop);
    }
  });
};

});
require.register("component-reactive/lib/attr-binding.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var debug = require('debug')('reactive:attr-binding');
var utils = require('./utils');

/**
 * Expose `AttrBinding`.
 */

module.exports = AttrBinding;

/**
 * Initialize a new attribute binding.
 *
 * @param {Reactive} view
 * @param {Element} node
 * @param {Attribute} attr
 * @api private
 */

function AttrBinding(reactive, node, attr) {
  var self = this;
  this.reactive = reactive;
  this.node = node;
  this.attr = attr;
  this.text = attr.value;
  this.props = utils.interpolationProps(this.text);
  this.subscribe();
  this.render();
}

/**
 * Subscribe to changes.
 */

AttrBinding.prototype.subscribe = function(){
  var self = this;
  var reactive = this.reactive;
  this.props.forEach(function(prop){
    reactive.sub(prop, function(){
      self.render();
    });
  });
};

/**
 * Render the value.
 */

AttrBinding.prototype.render = function(){
  var attr = this.attr;
  var text = this.text;
  var reactive = this.reactive;
  var model = reactive.model;

  // TODO: delegate most of this to `Reactive`
  debug('render %s "%s"', attr.name, text);
  attr.value = utils.interpolate(text, function(prop, fn){
    if (fn) {
      return fn(model, reactive.view, utils.call);
    } else {
      return reactive.get(model, prop);
    }
  });
};

});
require.register("component-reactive/lib/binding.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var parse = require('format-parser');

/**
 * Expose `Binding`.
 */

module.exports = Binding;

/**
 * Initialize a binding.
 *
 * @api private
 */

function Binding(name, reactive, el, fn) {
  this.name = name;
  this.reactive = reactive;
  this.model = reactive.model;
  this.view = reactive.view;
  this.el = el;
  this.fn = fn;
}

/**
 * Apply the binding.
 *
 * @api private
 */

Binding.prototype.bind = function() {
  var val = this.el.getAttribute(this.name);
  this.fn(this.el, val, this.model);
};

/**
 * Perform interpolation on `name`.
 *
 * @param {String} name
 * @return {String}
 * @api public
 */

Binding.prototype.interpolate = function(name) {
  var self = this;
  name = clean(name);

  if (~name.indexOf('{')) {
    return name.replace(/{([^}]+)}/g, function(_, name){
      return self.value(name);
    });
  }

  return this.formatted(name);
};

/**
 * Return value for property `name`.
 *
 *  - check if the "view" has a `name` method
 *  - check if the "model" has a `name` method
 *  - check if the "model" has a `name` property
 *
 * @param {String} name
 * @return {Mixed}
 * @api public
 */

Binding.prototype.value = function(name) {
  var view = this.view;
  name = clean(name);

  // view method
  if ('function' == typeof view[name]) {
    return view[name]();
  }

  // view value
  if (view.hasOwnProperty(name)) {
    return view[name];
  }

  return this.reactive.get(name);
};

/**
 * Return formatted property.
 *
 * @param {String} fmt
 * @return {Mixed}
 * @api public
 */

Binding.prototype.formatted = function(fmt) {
  var calls = parse(clean(fmt));
  var name = calls[0].name;
  var val = this.value(name);

  for (var i = 1; i < calls.length; ++i) {
    var call = calls[i];
    call.args.unshift(val);
    var fn = this.view[call.name];
    val = fn.apply(this.view, call.args);
  }

  return val;
};

/**
 * Invoke `fn` on changes.
 *
 * @param {Function} fn
 * @api public
 */

Binding.prototype.change = function(fn) {
  fn.call(this);

  var self = this;
  var reactive = this.reactive;
  var val = this.el.getAttribute(this.name);

  // computed props
  var parts = val.split('<');
  val = parts[0];
  var computed = parts[1];
  if (computed) computed = computed.trim().split(/\s+/);

  // interpolation
  if (hasInterpolation(val)) {
    var props = interpolationProps(val);
    props.forEach(function(prop){
      reactive.sub(prop, fn.bind(self));
    });
    return;
  }

  // formatting
  var calls = parse(val);
  var prop = calls[0].name;

  // computed props
  if (computed) {
    computed.forEach(function(prop){
      reactive.sub(prop, fn.bind(self));
    });
    return;
  }

  // bind to prop
  reactive.sub(prop, fn.bind(this));
};

/**
 * Return interpolation property names in `str`,
 * for example "{foo} and {bar}" would return
 * ['foo', 'bar'].
 *
 * @param {String} str
 * @return {Array}
 * @api private
 */

function interpolationProps(str) {
  var m;
  var arr = [];
  var re = /\{([^}]+)\}/g;
  while (m = re.exec(str)) {
    arr.push(m[1]);
  }
  return arr;
}

/**
 * Check if `str` has interpolation.
 *
 * @param {String} str
 * @return {Boolean}
 * @api private
 */

function hasInterpolation(str) {
  return ~str.indexOf('{');
}

/**
 * Remove computed properties notation from `str`.
 *
 * @param {String} str
 * @return {String}
 * @api private
 */

function clean(str) {
  return str.split('<')[0].trim();
}

});
require.register("component-reactive/lib/bindings.js", function(exports, require, module){
/**
 * Module dependencies.
 */

var classes = require('classes');
var event = require('event');

/**
 * Attributes supported.
 */

var attrs = [
  'id',
  'src',
  'rel',
  'cols',
  'rows',
  'name',
  'href',
  'title',
  'class',
  'style',
  'width',
  'value',
  'height',
  'tabindex',
  'placeholder'
];

/**
 * Events supported.
 */

var events = [
  'change',
  'click',
  'dblclick',
  'mousedown',
  'mouseup',
  'blur',
  'focus',
  'input',
  'submit',
  'keydown',
  'keypress',
  'keyup'
];

/**
 * Apply bindings.
 */

module.exports = function(reactive){

  /**
   * Generate attribute bindings.
   */

  attrs.forEach(function(attr){
    reactive.bind('data-' + attr, function(el, name, obj){
      this.change(function(){
        el.setAttribute(attr, this.interpolate(name));
      });
    });
  });

/**
 * Append child element.
 */

  reactive.bind('data-append', function(el, name){
    var other = this.value(name);
    el.appendChild(other);
  });

/**
 * Replace element.
 */

  reactive.bind('data-replace', function(el, name){
    var other = this.value(name);
    el.parentNode.replaceChild(other, el);
  });

  /**
   * Show binding.
   */

  reactive.bind('data-show', function(el, name){
    this.change(function(){
      if (this.value(name)) {
        classes(el).add('show').remove('hide');
      } else {
        classes(el).remove('show').add('hide');
      }
    });
  });

  /**
   * Hide binding.
   */

  reactive.bind('data-hide', function(el, name){
    this.change(function(){
      if (this.value(name)) {
        classes(el).remove('show').add('hide');
      } else {
        classes(el).add('show').remove('hide');
      }
    });
  });

  /**
   * Checked binding.
   */

  reactive.bind('data-checked', function(el, name){
    this.change(function(){
      if (this.value(name)) {
        el.setAttribute('checked', 'checked');
      } else {
        el.removeAttribute('checked');
      }
    });
  });

  /**
   * Text binding.
   */

  reactive.bind('data-text', function(el, name){
    this.change(function(){
      el.textContent = this.interpolate(name);
    });
  });

  /**
   * HTML binding.
   */

  reactive.bind('data-html', function(el, name){
    this.change(function(){
      el.innerHTML = this.formatted(name);
    });
  });

  /**
   * Generate event bindings.
   */

  events.forEach(function(name){
    reactive.bind('on-' + name, function(el, method){
      var view = this.reactive.view;
      event.bind(el, name, function(e){
        var fn = view[method];
        if (!fn) throw new Error('method .' + method + '() missing');
        view[method](e);
      });
    });
  });
};

});
require.register("component-reactive/lib/adapter.js", function(exports, require, module){
/**
 * Default subscription method.
 * Subscribe to changes on the model.
 *
 * @param {Object} obj
 * @param {String} prop
 * @param {Function} fn
 */

exports.subscribe = function(obj, prop, fn) {
  if (!obj.on) return;
  obj.on('change ' + prop, fn);
};

/**
 * Default unsubscription method.
 * Unsubscribe from changes on the model.
 */

exports.unsubscribe = function(obj, prop, fn) {
  if (!obj.off) return;
  obj.off('change ' + prop, fn);
};

/**
 * Default setter method.
 * Set a property on the model.
 *
 * @param {Object} obj
 * @param {String} prop
 * @param {Mixed} val
 */

exports.set = function(obj, prop, val) {
  if ('function' == typeof obj[prop]) {
    obj[prop](val);
  } else {
    obj[prop] = val;
  }
};

/**
 * Default getter method.
 * Get a property from the model.
 *
 * @param {Object} obj
 * @param {String} prop
 * @return {Mixed}
 */

exports.get = function(obj, prop) {
  if ('function' == typeof obj[prop]) {
    return obj[prop]();
  } else {
    return obj[prop];
  }
};

});
require.register("weather-view/index.js", function(exports, require, module){

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


});
require.register("boot/boot.js", function(exports, require, module){

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


});






















require.register("weather-view/template.html", function(exports, require, module){
module.exports = '<div class="weather">\n  <div class="weather-measure temperature temperature-outside">{ outsideTemp || \'\' }</div>\n  <div class="weather-measure temperature temperature-inside"> { insideTemp || \'\' }</div>\n  <div class="weather-measure windspeed">{ windSpeed || \'\' }</div>\n</div>\n';
});
require.alias("boot/boot.js", "boot/deps/boot/boot.js");
require.alias("boot/boot.js", "boot/deps/boot/index.js");
require.alias("boot/boot.js", "boot/index.js");
require.alias("component-dom/index.js", "boot/deps/dom/index.js");
require.alias("component-type/index.js", "component-dom/deps/type/index.js");

require.alias("component-event/index.js", "component-dom/deps/event/index.js");

require.alias("component-delegate/index.js", "component-dom/deps/delegate/index.js");
require.alias("component-matches-selector/index.js", "component-delegate/deps/matches-selector/index.js");
require.alias("component-query/index.js", "component-matches-selector/deps/query/index.js");

require.alias("component-event/index.js", "component-delegate/deps/event/index.js");

require.alias("component-indexof/index.js", "component-dom/deps/indexof/index.js");

require.alias("component-domify/index.js", "component-dom/deps/domify/index.js");

require.alias("component-classes/index.js", "component-dom/deps/classes/index.js");
require.alias("component-indexof/index.js", "component-classes/deps/indexof/index.js");

require.alias("component-css/index.js", "component-dom/deps/css/index.js");

require.alias("component-sort/index.js", "component-dom/deps/sort/index.js");

require.alias("component-value/index.js", "component-dom/deps/value/index.js");
require.alias("component-value/index.js", "component-dom/deps/value/index.js");
require.alias("component-type/index.js", "component-value/deps/type/index.js");

require.alias("component-value/index.js", "component-value/index.js");
require.alias("component-query/index.js", "component-dom/deps/query/index.js");

require.alias("component-matches-selector/index.js", "component-dom/deps/matches-selector/index.js");
require.alias("component-query/index.js", "component-matches-selector/deps/query/index.js");

require.alias("yields-traverse/index.js", "component-dom/deps/traverse/index.js");
require.alias("yields-traverse/index.js", "component-dom/deps/traverse/index.js");
require.alias("component-matches-selector/index.js", "yields-traverse/deps/matches-selector/index.js");
require.alias("component-query/index.js", "component-matches-selector/deps/query/index.js");

require.alias("yields-traverse/index.js", "yields-traverse/index.js");
require.alias("component-raf/index.js", "boot/deps/raf/index.js");

require.alias("component-model/lib/index.js", "boot/deps/model/lib/index.js");
require.alias("component-model/lib/static.js", "boot/deps/model/lib/static.js");
require.alias("component-model/lib/proto.js", "boot/deps/model/lib/proto.js");
require.alias("component-model/lib/index.js", "boot/deps/model/index.js");
require.alias("component-each/index.js", "component-model/deps/each/index.js");
require.alias("component-to-function/index.js", "component-each/deps/to-function/index.js");

require.alias("component-type/index.js", "component-each/deps/type/index.js");

require.alias("component-emitter/index.js", "component-model/deps/emitter/index.js");
require.alias("component-indexof/index.js", "component-emitter/deps/indexof/index.js");

require.alias("component-collection/index.js", "component-model/deps/collection/index.js");
require.alias("component-enumerable/index.js", "component-collection/deps/enumerable/index.js");
require.alias("component-to-function/index.js", "component-enumerable/deps/to-function/index.js");

require.alias("visionmedia-superagent/lib/client.js", "component-model/deps/superagent/lib/client.js");
require.alias("visionmedia-superagent/lib/client.js", "component-model/deps/superagent/index.js");
require.alias("component-emitter/index.js", "visionmedia-superagent/deps/emitter/index.js");
require.alias("component-indexof/index.js", "component-emitter/deps/indexof/index.js");

require.alias("RedVentures-reduce/index.js", "visionmedia-superagent/deps/reduce/index.js");

require.alias("visionmedia-superagent/lib/client.js", "visionmedia-superagent/index.js");
require.alias("component-model/lib/index.js", "component-model/index.js");
require.alias("heavyk-format/index.js", "boot/deps/format/index.js");

require.alias("visionmedia-page.js/index.js", "boot/deps/page/index.js");

require.alias("visionmedia-superagent/lib/client.js", "boot/deps/superagent/lib/client.js");
require.alias("visionmedia-superagent/lib/client.js", "boot/deps/superagent/index.js");
require.alias("component-emitter/index.js", "visionmedia-superagent/deps/emitter/index.js");
require.alias("component-indexof/index.js", "component-emitter/deps/indexof/index.js");

require.alias("RedVentures-reduce/index.js", "visionmedia-superagent/deps/reduce/index.js");

require.alias("visionmedia-superagent/lib/client.js", "visionmedia-superagent/index.js");
require.alias("weather-view/index.js", "boot/deps/weather-view/index.js");
require.alias("component-domify/index.js", "weather-view/deps/domify/index.js");

require.alias("component-emitter/index.js", "weather-view/deps/emitter/index.js");
require.alias("component-indexof/index.js", "component-emitter/deps/indexof/index.js");

require.alias("component-reactive/lib/index.js", "weather-view/deps/reactive/lib/index.js");
require.alias("component-reactive/lib/utils.js", "weather-view/deps/reactive/lib/utils.js");
require.alias("component-reactive/lib/text-binding.js", "weather-view/deps/reactive/lib/text-binding.js");
require.alias("component-reactive/lib/attr-binding.js", "weather-view/deps/reactive/lib/attr-binding.js");
require.alias("component-reactive/lib/binding.js", "weather-view/deps/reactive/lib/binding.js");
require.alias("component-reactive/lib/bindings.js", "weather-view/deps/reactive/lib/bindings.js");
require.alias("component-reactive/lib/adapter.js", "weather-view/deps/reactive/lib/adapter.js");
require.alias("component-reactive/lib/index.js", "weather-view/deps/reactive/index.js");
require.alias("component-format-parser/index.js", "component-reactive/deps/format-parser/index.js");

require.alias("component-props/index.js", "component-reactive/deps/props/index.js");
require.alias("component-props/index.js", "component-reactive/deps/props/index.js");
require.alias("component-props/index.js", "component-props/index.js");
require.alias("visionmedia-debug/index.js", "component-reactive/deps/debug/index.js");
require.alias("visionmedia-debug/debug.js", "component-reactive/deps/debug/debug.js");

require.alias("component-event/index.js", "component-reactive/deps/event/index.js");

require.alias("component-classes/index.js", "component-reactive/deps/classes/index.js");
require.alias("component-indexof/index.js", "component-classes/deps/indexof/index.js");

require.alias("component-query/index.js", "component-reactive/deps/query/index.js");

require.alias("component-reactive/lib/index.js", "component-reactive/index.js");
require.alias("boot/boot.js", "boot/index.js");