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
   * internal logic of `ctx.session`
   * @return {Session} session object
   *
   * @api public
   */

  get() {
    const session = this.session;
    // already retrieved
    if (session) return session;
    // unset
    if (session === false) return null;

    // cookie session store
    if (!this.store) this.initFromCookie();
    return this.session;
  }

  /**
   * internal logic of `ctx.session=`
   * @param {Object} val session object
   *
   * @api public
   */

  set(val) {
    if (val === null) {
      this.session = false;
      return;
    }
    if (typeof val === 'object') {
      // use the original `externalKey` if exists to avoid waste storage
      this.create(val, this.externalKey);
      return;
    }
    throw new Error('this.session can only be set as null or an object.');
  }

  /**
   * init session from external store
   * will be called in the front of session middleware
   *
   * @api public
   */

  async initFromExternal() {
    debug('init from external');
    const ctx = this.ctx;
    const opts = this.opts;

    const externalKey = ctx.cookies.get(opts.key, opts);
    debug('get external key from cookie %s', externalKey);

    if (!externalKey) {
      // create a new `externalKey`
      this.create();
      return;
    }

    const json = await this.store.get(externalKey);
    if (!this.valid(json)) {
      // create a new `externalKey`
      this.create();
      return;
    }

    // create with original `externalKey`
    this.create(json, externalKey);
    this.prevHash = util.hash(this.session.toJSON());
  }

  /**
   * init session from cookie
   * @api private
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
      if (!(err instanceof SyntaxError)) {
        // clean this cookie to ensure next request won't throw again
        ctx.cookies.set(opts.key, '', opts);
        // ctx.onerror will unset all headers, and set those specified in err
        err.headers = {
          'set-cookie': ctx.response.get('set-cookie'),
        };
        throw err;
      }
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

  async commit() {
    const session = this.session;
    const prevHash = this.prevHash;
    const opts = this.opts;
    const ctx = this.ctx;

    // not accessed
    if (undefined === session) return;

    // removed
    if (session === false) {
      await this.remove();
      return;
    }

    // force save session when `session._requireSave` set
    if (!session._requireSave) {
      const json = session.toJSON();
      // do nothing if new and not populated
      if (!prevHash && !Object.keys(json).length) return;
      // do nothing if not changed
      if (prevHash === util.hash(json)) return;
    }

    if (typeof opts.beforeSave === 'function') {
      debug('before save');
      opts.beforeSave(ctx, session);
    }
    await this.save();
  }

  /**
   * remove session
   * @api private
   */

  async remove() {
    const opts = this.opts;
    const ctx = this.ctx;
    const key = opts.key;
    const externalKey = this.externalKey;

    if (externalKey) await this.store.destroy(externalKey);
    ctx.cookies.set(key, '', opts);
  }

  /**
   * save session
   * @api private
   */

  async save() {
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
      await this.store.set(externalKey, json, maxAge);
      this.ctx.cookies.set(key, externalKey, opts);
      return;
    }

    // save to cookie
    debug('save %j to cookie', json);
    json = opts.encode(json);
    debug('save %s', json);

    this.ctx.cookies.set(key, json, opts);
  }
}

module.exports = ContextSession;
