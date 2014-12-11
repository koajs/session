/**
 * Module dependencies.
 */

var debug = require('debug')('koa-session');

/**
 * Initialize session middleware with `opts`:
 *
 * - `key` session cookie name ["koa:sess"]
 * - all other options are passed as cookie options
 *
 * @param {Object} [opts]
 * @param {Application} app, koa application instance
 * @api public
 */

module.exports = function(opts, app){
  // session(app[, opts])
  if (opts && typeof opts.use === 'function') {
    var tmp = app;
    app = opts;
    opts = tmp;
  }

  opts = opts || {};

  // key
  opts.key = opts.key || 'koa:sess';

  // defaults
  if (null == opts.overwrite) opts.overwrite = true;
  if (null == opts.httpOnly) opts.httpOnly = true;
  if (null == opts.signed) opts.signed = true;

  debug('session options %j', opts);

  if (!app || typeof app.use !== 'function') {
    throw new TypeError('app instance required: `session(opts, app)`');
  }

  // to pass to Session()
  app.context.sessionOptions = opts;
  app.context.sessionKey = opts.key;

  app.context.__defineGetter__('session', function(){
    var sess = this._sess;
    // already retrieved
    if (sess) return sess;

    // unset
    if (false === sess) return null;

    var json = this._sessjson = this.cookies.get(opts.key, opts);

    if (json) {
      debug('parse %s', json);
      try {
        sess = new Session(this, decode(json));
      } catch (err) {
        // backwards compatibility:
        // create a new session if parsing fails.
        // new Buffer(string, 'base64') does not seem to crash
        // when `string` is not base64-encoded.
        // but `JSON.parse(string)` will crash.
        if (!(err instanceof SyntaxError)) throw err;
        sess = new Session(this);
      }
    } else {
      debug('new session');
      sess = new Session(this);
    }

    this._sess = sess;
    return sess;
  });

  app.context.__defineSetter__('session', function(val){
    if (null == val) return this._sess = false;
    if ('object' == typeof val) return this._sess = new Session(this, val);
    throw new Error('this.session can only be set as null or an object.');
  });

  return function* (next){
    try {
      yield *next;
    } catch (err) {
      throw err;
    } finally {
      commit(this, this._sessjson, this._sess, opts);
    }
  }
};

/**
 * Commit the session changes or removal.
 *
 * @param {Context} ctx
 * @param {String} json
 * @param {Object} sess
 * @param {Object} opts
 * @api private
 */

function commit(ctx, json, sess, opts) {
  // not accessed
  if (undefined === sess) return;

  // removed
  if (false === sess) {
    ctx.cookies.set(opts.key, '', opts);
    return;
  }

  // do nothing if new and not populated
  if (!json && !sess.length) return;

  // save
  if (sess.changed(json)) sess.save();
}

/**
 * Session model.
 *
 * @param {Context} ctx
 * @param {Object} obj
 * @api private
 */

function Session(ctx, obj) {
  this._ctx = ctx;
  if (!obj) this.isNew = true;
  else for (var k in obj) this[k] = obj[k];
}

/**
 * JSON representation of the session.
 *
 * @return {Object}
 * @api public
 */

Session.prototype.inspect =
Session.prototype.toJSON = function(){
  var self = this;
  var obj = {};

  Object.keys(this).forEach(function(key){
    if ('isNew' == key) return;
    if ('_' == key[0]) return;
    obj[key] = self[key];
  });

  return obj;
};

/**
 * Check if the session has changed relative to the `prev`
 * JSON value from the request.
 *
 * @param {String} [prev]
 * @return {Boolean}
 * @api private
 */

Session.prototype.changed = function(prev){
  if (!prev) return true;
  this._json = encode(this);
  return this._json != prev;
};

/**
 * Return how many values there are in the session object.
 * Used to see if it's "populated".
 *
 * @return {Number}
 * @api public
 */

Session.prototype.__defineGetter__('length', function(){
  return Object.keys(this.toJSON()).length;
});

/**
 * populated flag, which is just a boolean alias of .length.
 *
 * @return {Boolean}
 * @api public
 */

Session.prototype.__defineGetter__('populated', function(){
  return !!this.length;
});

/**
 * Save session changes by
 * performing a Set-Cookie.
 *
 * @api private
 */

Session.prototype.save = function(){
  var ctx = this._ctx;
  var json = this._json || encode(this);
  var opts = ctx.sessionOptions;
  var key = ctx.sessionKey;

  debug('save %s', json);
  ctx.cookies.set(key, json, opts);
};

/**
 * Decode the base64 cookie value to an object.
 *
 * @param {String} string
 * @return {Object}
 * @api private
 */

function decode(string) {
  var body = new Buffer(string, 'base64').toString('utf8');
  return JSON.parse(body);
}

/**
 * Encode an object into a base64-encoded JSON string.
 *
 * @param {Object} body
 * @return {String}
 * @api private
 */

function encode(body) {
  body = JSON.stringify(body);
  return new Buffer(body).toString('base64');
}
