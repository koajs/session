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
    this.store = this.opts.store;
  }

  /**
   * init session from external store
   * @api public
   */

  * initFromExternal() {
    debug('init from external');
    const ctx = this.ctx;
    const opts = this.opts;

    const externalKey = ctx.cookies.get(opts.key, opts);
    debug('get external key from cookie %s', externalKey);

    if (!externalKey) {
      this.create();
      return;
    }

    const json = yield this.store.get(externalKey, ctx);
    if (!this.valid(json)) {
      this.create();
      return;
    }

    if (!json) {
      this.create();
      return;
    }

    this.create(json, externalKey);
    this.prevHash = util.hash(this.session.toJSON());
  }

  /**
   * init session from cookie
   * @api public
   */

  initFromCookie() {
    debug('init from cookie');
    const ctx = this.ctx;
    const opts = this.opts;

    const cookie = ctx.cookies.get(opts.key, opts);
    if (!cookie) {
      this.create();
      return;
    }

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
      this.create();
      return;
    }

    debug('parsed %j', json);

    if (!this.valid(json)) {
      this.create();
      return;
    }

    // support access `ctx.session` before session middleware
    this.create(json);
    this.prevHash = util.hash(this.session.toJSON());
  }

  /**
   * verify session(expired or )
   * @param  {Object} json session object
   * @return {Boolean} valid
   * @api private
   */

  valid(json) {
    if (!json) return false;

    if (!json._expire || json._expire < Date.now()) {
      debug('expired session');
      return false;
    }

    const valid = this.opts.valid;
    if (typeof valid === 'function' && !valid(this.ctx, json)) {
      // valid session value fail, ignore this session
      debug('invalid session');
      return false;
    }
    return true;
  }

  /**
   * create a new session and attach to ctx.sess
   *
   * @param {Object} [val] session data
   * @param {String} [externalKey] session external key
   * @api private
   */

  create(val, externalKey) {
    debug('create session with val: %j externalKey: %s', val, externalKey);
    if (this.opts.store) this.externalKey = externalKey || uid.sync(24);
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
    if (session === false) {
      yield this.remove();
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
    yield this.save();
  }

  /**
   * remove session
   * @api private
   */

  * remove() {
    const opts = this.opts;
    const ctx = this.ctx;
    const key = opts.key;
    const externalKey = this.externalKey;

    if (externalKey) yield this.store.destroy(externalKey);
    ctx.cookies.set(key, '', opts);
  }

  /**
   * save session
   * @api private
   */

  * save() {
    const opts = this.opts;
    const key = opts.key;
    const externalKey = this.externalKey;

    const maxAge = opts.maxAge || ONE_DAY;

    let json = this.session.toJSON();
    // set expire for check
    json._expire = maxAge + Date.now();
    json._maxAge = maxAge;

    // save to external store
    if (externalKey) {
      debug('save %j to external key %s', json, externalKey);
      yield this.store.set(externalKey, json, maxAge);
      this.ctx.cookies.set(key, externalKey, opts);
      return;
    }

    // save to cookie
    debug('save %j to cookie', json);
    try {
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
