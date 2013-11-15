
/**
 * Module dependencies.
 */

var debug = require('debug')('koa-session');
var uid = require('uid2');

/**
 * Initialize session middleware with `opts`:
 *
 * - `key` session cookie name ["koa:sess"]
 * - all other options are passed as cookie options
 *
 * @param {Object} [opts]
 * @api public
 */

module.exports = function(opts){
  opts = opts || {};

  // key
  var key = opts.key || 'koa:sess';

  // defaults
  if (null == opts.overwrite) opts.overwrite = true;
  if (null == opts.httpOnly) opts.httpOnly = true;
  if (null == opts.signed) opts.signed = true;

  debug('session options %j', opts);

  return function(next){
    return function *(){
      var json = this.cookies.get(key, opts);
      this.sessionOptions = opts;
      this.sessionKey = key;

      if (json) {
        debug('parse %s', json);
        var sess = this.session = new Session(this, JSON.parse(json));
      } else {
        debug('new session');
        var sess = this.session = new Session(this);
      }

      yield next;

      // remove session
      if (!this.session) return sess.remove();

      // save new sessions
      if (!sess._saved && sess.isNew) {
        debug('auto-saving new session');
        sess.save();
      }
    }
  }
};

/**
 * Session model.
 *
 * @param {Context} ctx
 * @param {Object} obj
 * @api private
 */

function Session(ctx, obj) {
  obj = obj || {};
  this._ctx = ctx;
  for (var k in obj) this[k] = obj[k];
  if (!this.sid) this.isNew = true;
  if (!this.sid) this.sid = uid(15);
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
    if ('isNew' == key[0]) return;
    if ('_' == key[0]) return;
    obj[key] = self[key];
  });

  return obj;
};

/**
 * Save session changes by
 * performing a Set-Cookie.
 *
 * @api public
 */

Session.prototype.save = function(){
  var ctx = this._ctx;
  var json = JSON.stringify(this);
  var opts = ctx.sessionOptions;
  var key = ctx.sessionKey;

  this._saved = true;
  debug('save %s', json);
  ctx.cookies.set(key, json, opts);
};

/**
 * Remove the session.
 *
 * @api public
 */

Session.prototype.remove = function(){
  var ctx = this._ctx;
  var opts = ctx.sessionOptions;
  var key = ctx.sessionKey;

  debug('remove');
  opts.expires = new Date(0);
  ctx.cookies.set(key, '', opts);
};
