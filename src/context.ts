import { debuglog } from 'node:util';
import { Session } from './session.js';
import util from './util.js';
import type { SessionOptions } from './index.js';

const debug = debuglog('koa-session:context');

const COOKIE_EXP_DATE = new Date(util.CookieDateEpoch);
const ONE_DAY = 24 * 60 * 60 * 1000;

export class ContextSession {
  ctx: any;
  app: any;
  opts: SessionOptions;
  store: SessionOptions['store'];
  session: Session | false;
  externalKey?: string;
  prevHash?: number;

  /**
   * context session constructor
   */
  constructor(ctx: any, opts: SessionOptions) {
    this.ctx = ctx;
    this.app = ctx.app;
    this.opts = { ...opts };
    this.store = this.opts.ContextStore ? new this.opts.ContextStore(ctx) : this.opts.store;
  }

  /**
   * internal logic of `ctx.session`
   * @return {Session} session object
   */
  get(): Session | null {
    // already retrieved
    if (this.session) return this.session;
    // unset
    if (this.session === false) return null;

    // create an empty session or init from cookie
    this.store ? this.create() : this.initFromCookie();
    return this.session as Session;
  }

  /**
   * internal logic of `ctx.session=`
   * @param {Object} val session object
   */
  set(val: Record<string, unknown> | null) {
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
   * @public
   */

  async initFromExternal() {
    debug('init from external');
    const ctx = this.ctx;
    const opts = this.opts;

    let externalKey;
    if (opts.externalKey) {
      externalKey = opts.externalKey.get(ctx);
      debug('get external key from custom %s', externalKey);
    } else {
      externalKey = ctx.cookies.get(opts.key, opts);
      debug('get external key from cookie %s', externalKey);
    }


    if (!externalKey) {
      // create a new `externalKey`
      this.create();
      return;
    }

    const sessionData = await this.store!.get(externalKey, opts.maxAge as number, { ctx, rolling: opts.rolling });
    if (!this.valid(sessionData, externalKey)) {
      debug('invalid session data, create a new session');
      // create a new `externalKey`
      this.create();
      return;
    }

    // create with original `externalKey`
    this.create(sessionData, externalKey);
    this.prevHash = util.hash((this.session as Session).toJSON());
  }

  /**
   * init session from cookie
   * @private
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

    let sessionData: Record<string, unknown>;
    debug('parse cookie: %j', cookie);
    try {
      sessionData = opts.decode(cookie);
    } catch (err: unknown) {
      // backwards compatibility:
      // create a new session if parsing fails.
      // `Buffer.from(string, 'base64')` does not seem to crash
      // when `string` is not base64-encoded.
      // but `JSON.parse(string)` will crash.
      debug('decode %j error: %s', cookie, err);
      if (err instanceof Error && !(err instanceof SyntaxError)) {
        // clean this cookie to ensure next request won't throw again
        ctx.cookies.set(opts.key, '', opts);
        // `ctx.onerror` will unset all headers, and set those specified in err
        Reflect.set(err, 'headers', {
          'set-cookie': ctx.response.get('set-cookie'),
        });
        throw err;
      }
      this.create();
      return;
    }

    debug('parsed session data: %j', sessionData);
    if (!this.valid(sessionData)) {
      // create a new session if the session data is invalid
      this.create();
      debug('invalid session data, create a new session');
      return;
    }

    // support access `ctx.session` before session middleware
    this.create(sessionData);
    this.prevHash = util.hash((this.session as Session).toJSON());
  }

  /**
   * verify session(expired or custom verification)
   * @param {Object} sessionData session data
   * @param {Object} [key] session externalKey(optional)
   * @private
   */
  protected valid(sessionData: Record<string, unknown>, key?: string) {
    const ctx = this.ctx;
    if (!sessionData) {
      this.emit('missed', { key, value: sessionData, ctx });
      return false;
    }

    if (typeof sessionData._expire === 'number' && sessionData._expire < Date.now()) {
      debug('expired session');
      this.emit('expired', { key, value: sessionData, ctx });
      return false;
    }

    const valid = this.opts.valid;
    if (typeof valid === 'function' && !valid(ctx, sessionData)) {
      // valid session value fail, ignore this session
      debug('invalid session');
      this.emit('invalid', { key, value: sessionData, ctx });
      return false;
    }
    return true;
  }

  /**
   * @param {String} event event name
   * @param {Object} data event data
   * @private
   */
  emit(event: string, data: unknown) {
    setImmediate(() => {
      this.app.emit(`session:${event}`, data);
    });
  }

  /**
   * create a new session and attach to ctx.sess
   *
   * @param {Object} [sessionData] session data
   * @param {String} [externalKey] session external key
   */
  protected create(sessionData?: Record<string, unknown>, externalKey?: string) {
    debug('create session with data: %j, externalKey: %s', sessionData, externalKey);
    if (this.store) {
      this.externalKey = externalKey ?? this.opts.genid?.(this.ctx);
    }
    this.session = new Session(this, sessionData, this.externalKey);
  }

  /**
   * Commit the session changes or removal.
   */
  async commit({ save = false, regenerate = false } = {}) {
    const session = this.session;
    const opts = this.opts;
    const ctx = this.ctx;

    // not accessed
    if (session === undefined) {
      return;
    }

    // removed
    if (session === false) {
      await this.remove();
      return;
    }

    if (regenerate) {
      await this.remove();
      if (this.store) {
        this.externalKey = opts.genid?.(ctx);
      }
    }

    // force save session when `session._requireSave` set
    const reason = save || regenerate || session._requireSave ? 'force' : this._shouldSaveSession();
    debug('should save session: %j', reason);
    if (!reason) {
      return;
    }

    if (typeof opts.beforeSave === 'function') {
      debug('before save');
      opts.beforeSave(ctx, session);
    }
    const changed = reason === 'changed';
    await this.save(changed);
  }

  _shouldSaveSession() {
    const prevHash = this.prevHash;
    const session = this.session as Session;

    // do nothing if new and not populated
    const sessionData = session.toJSON();
    if (!prevHash && !Object.keys(sessionData).length) {
      return '';
    }

    // save if session changed
    const changed = prevHash !== util.hash(sessionData);
    if (changed) {
      return 'changed';
    }

    // save if opts.rolling set
    if (this.opts.rolling) {
      return 'rolling';
    }

    // save if opts.renew and session will expired
    if (this.opts.renew) {
      const expire = session._expire;
      const maxAge = session.maxAge;
      // renew when session will expired in maxAge / 2
      if (expire && maxAge && expire - Date.now() < maxAge / 2) {
        return 'renew';
      }
    }

    // don't save
    return '';
  }

  /**
   * remove session
   * @private
   */
  async remove() {
    // Override the default options so that we can properly expire the session cookies
    const opts = {
      ...this.opts,
      expires: COOKIE_EXP_DATE,
      maxAge: false,
    };
    const ctx = this.ctx;
    const key = opts.key;
    const externalKey = this.externalKey;

    if (externalKey) {
      await this.store!.destroy(externalKey, { ctx });
    }
    ctx.cookies.set(key, '', opts);
  }

  /**
   * save session
   * @private
   */
  async save(changed: boolean) {
    const opts = this.opts;
    const key = opts.key;
    const externalKey = this.externalKey;
    const sessionData = (this.session as Session).toJSON();
    // set expire for check
    let maxAge = opts.maxAge ? opts.maxAge : ONE_DAY;
    if (maxAge === 'session') {
      // do not set _expire in json if maxAge is set to 'session'
      // also delete maxAge from options
      opts.maxAge = undefined;
      sessionData._session = true;
    } else {
      // set expire for check
      sessionData._expire = maxAge + Date.now();
      sessionData._maxAge = maxAge;
    }

    // save to external store
    if (externalKey) {
      debug('save %j to external key %s', sessionData, externalKey);
      if (typeof maxAge === 'number') {
        // ensure store expired after cookie
        maxAge += 10000;
      }
      await this.store!.set(externalKey, sessionData, maxAge as number, {
        changed,
        ctx: this.ctx,
        rolling: opts.rolling,
      });
      if (opts.externalKey) {
        opts.externalKey.set(this.ctx, externalKey);
      } else {
        this.ctx.cookies.set(key, externalKey, opts);
      }
      return;
    }

    // save to cookie with base64 encode string
    debug('save session data %j to cookie', sessionData);
    const base64String = opts.encode(sessionData);
    debug('save session data json base64 format: %s to cookie key: %s with options: %j',
      base64String, key, opts);
    this.ctx.cookies.set(key, base64String, opts);
  }
}
