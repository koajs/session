'use strict';

const debug = require('debug')('koa-session:context');
const Session = require('./session');
const uid = require('uid-safe');
const util = require('./util');

const ONE_DAY = 24 * 60 * 60 * 1000;

class ContextSession {
  /**
   * context session constructor
   * @api public
   */

  constructor(ctx, opts) {
    this.ctx = ctx;
    this.opts = Object.assign({}, opts);
  }

  /**
   * init session from external store
   * @api public
   */

  * initFromExternal() {
    const ctx = this.ctx;
    const opts = this.opts;

    const externalKey = ctx.cookies.get(opts.key, opts);
    if (!externalKey) return this.createSession();

    var obj = yield opts.external.get(externalKey, ctx);
    if (!obj) return this.createSession();

    this.createSession(obj, externalKey);
    this.prevHash = util.hash(this.ctx._sess.toJSON());
  }

  /**
   * init session from cookie
   * @api public
   */
  initFromCookie() {
    const ctx = this.ctx;
    const opts = this.opts;

    const cookie = ctx.cookies.get(opts.key, opts);
    if (!cookie) return this.createSession();

    let json;
    debug('parse %s', cookie);
    try {
      json = opts.decode(cookie);
    } catch (err) {
      // backwards compatibility:
      // create a new session if parsing fails.
      // new Buffer(string, 'base64') does not seem to crash
      // when `string` is not base64-encoded.
      // but `JSON.parse(string)` will crash.
      debug('decode %j error: %s', cookie, err);
      if (!(err instanceof SyntaxError)) throw err;
      return this.createSession();
    }

    debug('parsed %j', json);

    if (!json._expire || json._expire < Date.now()) {
      debug('expired session');
      return this.createSession();
    }

    if (typeof opts.valid === 'function' && !opts.valid(ctx, json)) {
      // valid session value fail, ignore this session
      debug('invalid session');
      return this.createSession();
    }

    // support access `ctx.session` before session middleware
    this.createSession(json);
    this.prevHash = util.hash(this.session.toJSON());
  }

  /**
   * create a new session and attach to ctx.sess
   *
   * @param {Object} [val]
   * @param {String} [externalKey]
   * @api private
   */
  createSession(val, externalKey) {
    if (this.opts.external) this.externalKey = externalKey || uid(24);
    this.session = new Session(this.ctx, val);
  }

  /**
   * Commit the session changes or removal.
   *
   * @api public
   */

  * commit() {
    const session = this.session;
    const prevHash = this.prevHash;
    const opts = this.opts;
    const ctx = this.ctx;

    // not accessed
    if (undefined === session) return;

    // removed
    if (false === session) {
      yield this.removeSession();
      return;
    }
    const json = session.toJSON();
    // do nothing if new and not populated
    if (!prevHash && !Object.keys(json).length) return;
    // do nothing if not changed
    if (prevHash === util.hash(json)) return;

    if (typeof opts.beforeSave === 'function') {
      debug('before save');
      opts.beforeSave(ctx, session);
    }
    yield this.saveSession();
  }


  /**
   * remove session
   * @api private
   */
  * removeSession() {
    const opts = this.opts;
    const ctx = this.ctx;
    const key = opts.key;
    const externalKey = this.externalKey;

    if (externalKey) yield opts.external.remove(externalKey);
    ctx.cookies.set(key, '', opts);
  }

  /**
   * save session
   * @api private
   */
  * saveSession() {
    let json = this.session.toJSON();
    //
    const opts = this.opts;
    const key = opts.key;
    const externalKey = this.externalKey;

    const maxAge = opts.maxAge || ONE_DAY;

    // save to external store
    if (externalKey) {
      debug('save %s to external key %s', json, externalKey);
      yield opts.external.set(externalKey, json, maxAge);
      this.ctx.cookies.set(key, externalKey, opts);
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

    this.ctx.cookies.set(key, json, opts);
  }
}

module.exports = ContextSession;
