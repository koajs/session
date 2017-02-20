/**
 * Module dependencies.
 */

var debug = require('debug')('koa-session');
var crc = require('crc').crc32;
var uid = require('uid-safe').sync;

var ONE_DAY = 24 * 60 * 60 * 1000;

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

  // back-compat maxage
  if (!('maxAge' in opts)) opts.maxAge = opts.maxage;

  // defaults
  if (null == opts.overwrite) opts.overwrite = true;
  if (null == opts.httpOnly) opts.httpOnly = true;
  if (null == opts.signed) opts.signed = true;

  debug('session options %j', opts);

  if (!app || typeof app.use !== 'function') {
    throw new TypeError('app instance required: `session(opts, app)`');
  }

  // setup encoding/decoding
  if (typeof opts.encode !== 'function') {
    opts.encode = encode
  }
  if (typeof opts.decode !== 'function') {
    opts.decode = decode
  }

  // to pass to Session()
  app.context.sessionKey = opts.key;

  app.context.__defineGetter__('session', function(){
    var sess = this._sess;
    // already retrieved
    if (sess) return sess;

    // unset
    if (false === sess) return null;

    if (opts.external) return null;

    // cookie session store
    initSessionFromCookie(this, opts);
    if (!this._sess) initSessionFromNull(this);
    return this._sess;
  });

  app.context.__defineSetter__('session', function(val){
    if (null == val) return this._sess = false;
    if ('object' == typeof val) return this._sess = new Session(this, val);
    throw new Error('this.session can only be set as null or an object.');
  });

  return function* session(next){
    // make sessionOptions independent in each request
    initSessionOptions(this, opts);
    // external session store
    if (opts.external) {
      yield initSessionFromExternal(this, opts);
      if (!this._sess) {
        initSessionFromNull(this);
        initSessionKey(this);
      }
    }
    try {
      yield next;
    } catch (err) {
      throw err;
    } finally {
      yield commit(this, this._prevSessHash, this._sess, opts);
    }
  };
};

function initSessionOptions(ctx, opts) {
  if (ctx.sessionOptions) {
    return;
  }
  ctx.sessionOptions = {};
  for (var key in opts) {
    ctx.sessionOptions[key] = opts[key];
  }
}

/**
 * Commit the session changes or removal.
 *
 * @param {Context} ctx
 * @param {Object} prevjson
 * @param {Object} sess
 * @param {Object} opts
 * @api private
 */

function* commit(ctx, prevHash, sess, opts) {
  // not accessed
  if (undefined === sess) return;

  // removed
  if (false === sess) {
    yield removeSession(ctx);
    return;
  }
  var json = sess.toJSON();
  // do nothing if new and not populated
  if (!prevHash && !Object.keys(json).length) return;
  if (prevHash === hash(json)) return;

  if (typeof opts.beforeSave === 'function') {
    debug('before save');
    opts.beforeSave(ctx, sess);
  }
  yield saveSession(ctx, sess);
}

function *initSessionFromExternal(ctx, opts) {
  var key = ctx.cookies.get(opts.key, opts);
  if (!key) return null;

  var obj = yield opts.external.get(key, ctx);
  if (!obj) return null;

  ctx._sess = new Session(ctx, obj);
  ctx._sessExternalKey = key;
  ctx._prevjson = hash(ctx._sess);
}

function initSessionKey(ctx, opts) {
  ctx._sessExternalKey = uid(24);
}

function initSessionFromCookie(ctx, opts) {
  var json = ctx.cookies.get(opts.key, opts);
  if (!json) return null;

  debug('parse %s', json);
  try {
    var obj = opts.decode(json);
    debug('parsed %j', obj);
    if (typeof opts.valid === 'function' && !opts.valid(ctx, obj)) {
      // valid session value fail, ignore this session
      debug('invalid %j', obj);
      return null;
    }
    initSessionOptions(ctx, opts);
    ctx._sess = new Session(ctx, obj);
    ctx._prevSessHash = hash(ctx._sess);
  } catch (err) {
    // backwards compatibility:
    // create a new session if parsing fails.
    // new Buffer(string, 'base64') does not seem to crash
    // when `string` is not base64-encoded.
    // but `JSON.parse(string)` will crash.
    debug('decode %j error: %s', json, err);
    if (!(err instanceof SyntaxError)) throw err;
    return null;
  }
}

function initSessionFromNull(ctx) {
  ctx._sess = new Session(ctx);
  ctx._prevSessHash = hash(ctx._sess);
}

function* removeSession(ctx) {
  var key = ctx.sessionKey;
  var opts = ctx.sessionOptions;
  var externalKey = ctx._sessExternalKey;

  if (externalKey) {
    yield opts.external.remove(externalKey);
  }
  ctx.cookies.set(opts.key, '', opts);
}

function* saveSession(ctx, sess) {
  var json = sess.toJSON();
  var opts = ctx.sessionOptions;
  var key = ctx.sessionKey;
  var externalKey = ctx._sessExternalKey;

  var maxAge = opts.maxAge || ONE_DAY;

  // save to external store
  if (externalKey) {
    debug('save %s to external key %s', json, externalKey);
    yield opts.external.set(externalKey, json, maxAge);
    ctx.cookies.set(key, externalKey, opts);
    return;
  }

  // save to cookie
  debug('save %j to cookie', json);
  try {
    // set expire into cookie value
    json._expire = maxAge + Date.now();
    json._maxAge = maxAge;
    json = opts.encode(json);
    debug('save %s', json);
  } catch (e) {
    debug('encode %j error: %s', json, e);
    json = '';
  }

  ctx.cookies.set(key, json, opts);
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
  if (!obj) {
    this.isNew = true;
  }
  else {
    for (var k in obj) {
      // change session options
      if ('_maxAge' == k) this._ctx.sessionOptions.maxAge = obj._maxAge;
      else this[k] = obj[k];
    }
  }
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
 * @param {Object} [prev]
 * @return {Boolean}
 * @api private
 */

Session.prototype.changed = function(prev){
  if (!prev) return true;
  return hash(sess) !== prev;
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
 * get session maxAge
 *
 * @return {Number}
 * @api public
 */

Session.prototype.__defineGetter__('maxAge', function(){
  return this._ctx.sessionOptions.maxAge;
});

/**
 * set session maxAge
 *
 * @param {Number}
 * @api public
 */

Session.prototype.__defineSetter__('maxAge', function(val){
  this._ctx.sessionOptions.maxAge = val;
});

/**
 * Decode the base64 cookie value to an object.
 *
 * @param {String} string
 * @return {Object}
 * @api private
 */

function decode(string) {
  var body = new Buffer(string, 'base64').toString('utf8');
  var json = JSON.parse(body);

  // check if the cookie is expired
  if (!json._expire) return null;
  if (json._expire < Date.now()) return null;
  return json;
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

function hash(sess) {
  if (sess instanceof Session) sess = sess.toJSON();
  return crc(JSON.stringify(sess));
}
