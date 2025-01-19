import assert from 'node:assert';
import { debuglog } from 'node:util';
import { randomUUID } from 'node:crypto';
import { isClass } from 'is-type-of';
import z from 'zod';
import { ContextSession } from './context.js';
import util from './util.js';

const debug = debuglog('koa-session');

const GET_CONTEXT_SESSION = Symbol('get contextSession');
const CONTEXT_SESSION_INSTANCE = Symbol('contextSession instance');

export const SessionOptions = z.object({
  /**
   * cookie key
   * Default is `koa.sess`
   */
  key: z.string().default('koa.sess'),
  /**
   * maxAge in ms
   * Default is `86400000`, one day
   * If set to 'session' will result in a cookie that expires when session/browser is closed
   *
   * Warning: If a session cookie is stolen, this cookie will never expire
   */
  maxAge: z.union([ z.number(), z.literal('session') ]).optional(),
  /**
   * automatically commit headers
   * Default is `true`
   */
  autoCommit: z.boolean().default(true),
  /**
   * cookie value can overwrite or not
   * Default is `true`
   */
  overwrite: z.boolean().default(true),
  /**
   * httpOnly or not
   * Default is `true`
   */
  httpOnly: z.boolean().default(true),
  /**
   * signed or not
   * Default is `true`
   */
  signed: z.boolean().default(true),
  /**
   * Force a session identifier cookie to be set on every response.
   * The expiration is reset to the original `maxAge`, resetting the expiration countdown.
   * Default is `false`
   */
  rolling: z.boolean().default(false),
  /**
   * renew session when session is nearly expired, so we can always keep user logged in.
   * Default is `false`
   */
  renew: z.boolean().default(false),
  /**
   * secure cookie
   * Default is `undefined`, will be set to `true` if the connection is over HTTPS, otherwise `false`.
   */
  secure: z.boolean().optional(),
  /**
   * session cookie sameSite options
   * Default is `undefined`, meaning don't set it
   */
  sameSite: z.string().optional(),
  /**
   * External key is used the cookie by default,
   * but you can use `options.externalKey` to customize your own external key methods.
   */
  externalKey: z.object({
    /**
     * get the external key
     * `(ctx) => string`
     */
    get: z.function()
      .args(z.any())
      .returns(z.string()),
    /**
     * set the external key
     * `(ctx, key) => void`
     */
    set: z.function()
      .args(z.any(), z.string())
      .returns(z.void()),
  }).optional(),
  /**
   * session storage is dependent on your external store
   */
  store: z.object({
    /**
     * get session data by key
     * `(key, maxAge, { rolling, ctx }) => sessionData | Promise<sessionData>`
     */
    get: z.function()
      .args(z.string(), z.number(), z.object({ rolling: z.boolean(), ctx: z.any() }))
      .returns(z.promise(z.any())),
    /**
     * set session data for key, with a `maxAge` (in ms)
     * `(key, sess, maxAge, { rolling, changed, ctx }) => void | Promise<void>`
     */
    set: z.function()
      .args(z.string(), z.any(), z.number(), z.object({ rolling: z.boolean(), changed: z.boolean(), ctx: z.any() }))
      .returns(z.promise(z.void())),
    /**
     * destroy session data for key
     * `(key, { ctx })=> void | Promise<void>`
     */
    destroy: z.function()
      .args(z.string(), z.object({ ctx: z.any() }))
      .returns(z.promise(z.void())),
  }).optional(),
  /**
   * If your session store requires data or utilities from context, `opts.ContextStore` is also supported.
   * `ContextStore` must be a class which claims three instance methods demonstrated above.
   * `new ContextStore(ctx)` will be executed on every request.
   */
  ContextStore: z.any().optional(),
  encode: z.function()
    .args(z.any())
    .returns(z.string())
    .optional()
    .default(() => util.encode),
  decode: z.function()
    .args(z.string())
    .returns(z.any())
    .default(() => util.decode),
  /**
   * If you want to generate a new session id, you can use `genid` option to customize it.
   * Default is a function that uses `randomUUID()`.
   * `(ctx) => string`
   */
  genid: z.function()
    .args(z.any())
    .returns(z.string())
    .optional(),
  /**
   * If you want to prefix the session id, you can use `prefix` option to customize it.
   * It will not work if `options.genid(ctx)` present.
   */
  prefix: z.string().optional(),
  /**
   * valid session value before use it
   * `(ctx, sessionData) => boolean`
   */
  valid: z.function()
    .args(z.any(), z.any())
    .returns(z.any())
    .optional(),
  /**
   * hook before save session
   * `(ctx, sessionModel) => void`
   */
  beforeSave: z.function()
    .args(z.any(), z.any())
    .returns(z.void())
    .optional(),
});

const DEFAULT_SESSION_OPTIONS = SessionOptions.parse({});

export type SessionOptions = z.infer<typeof SessionOptions>;
export type CreateSessionOptions = Partial<SessionOptions>;

type Middleware = (ctx: any, next: any) => Promise<void>;

/**
 * Initialize session middleware with `opts`:
 *
 * - `key` session cookie name ["koa.sess"]
 * - all other options are passed as cookie options
 *
 * @param {Object} [opts] session options
 * @param {Application} app koa application instance
 * @public
 */
export function createSession(opts: CreateSessionOptions, app: any): Middleware;
export function createSession(app: any, opts?: CreateSessionOptions): Middleware;
export function createSession(opts: CreateSessionOptions | any, app: any): Middleware {
  // session(app[, opts])
  if (opts && 'use' in opts && typeof opts.use === 'function') {
    [ app, opts ] = [ opts, app ];
  }
  // app required
  if (typeof app?.use !== 'function') {
    throw new TypeError('app instance required: `session(opts, app)`');
  }

  const options: SessionOptions = opts ?? {};

  // back-compat maxage
  if (!('maxAge' in options) && 'maxage' in options) {
    Reflect.set(options, 'maxAge', Reflect.get(options, 'maxage'));
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[koa-session] DeprecationWarning: `maxage` option has been renamed to `maxAge`');
    }
  }

  // keep backwards compatibility: make sure options instance is not mutated
  Object.assign(options, {
    ...DEFAULT_SESSION_OPTIONS,
    ...options,
  });
  SessionOptions.parse(options);
  formatOptions(options);
  extendContext(app.context, options);

  return async function session(ctx: any, next: any) {
    const sess = ctx[GET_CONTEXT_SESSION];
    if (sess.store) {
      await sess.initFromExternal();
    }
    try {
      await next();
    } catch (err) {
      throw err;
    } finally {
      if (options.autoCommit) {
        await sess.commit();
      }
    }
  };
}

// Usage: `import session from 'koa-session'`
export default createSession;

/**
 * format and check session options
 */
function formatOptions(opts: SessionOptions) {
  // defaults
  if (opts.overwrite == null) opts.overwrite = true;
  if (opts.httpOnly == null) opts.httpOnly = true;
  // delete null sameSite config
  if (opts.sameSite == null) delete opts.sameSite;
  if (opts.signed == null) opts.signed = true;
  if (opts.autoCommit == null) opts.autoCommit = true;

  debug('session options %j', opts);
  const store = opts.store;
  if (store) {
    assert(typeof store.get === 'function', 'store.get must be function');
    assert(typeof store.set === 'function', 'store.set must be function');
    assert(typeof store.destroy === 'function', 'store.destroy must be function');
  }

  const externalKey = opts.externalKey;
  if (externalKey) {
    assert(typeof externalKey.get === 'function', 'externalKey.get must be function');
    assert(typeof externalKey.set === 'function', 'externalKey.set must be function');
  }

  const ContextStore = opts.ContextStore;
  if (ContextStore) {
    assert(isClass(ContextStore), 'ContextStore must be a class');
    assert(typeof ContextStore.prototype.get === 'function', 'ContextStore.prototype.get must be function');
    assert(typeof ContextStore.prototype.set === 'function', 'ContextStore.prototype.set must be function');
    assert(typeof ContextStore.prototype.destroy === 'function', 'ContextStore.prototype.destroy must be function');
  }

  if (!opts.genid) {
    if (opts.prefix) {
      opts.genid = () => `${opts.prefix}${randomUUID()}`;
    } else {
      opts.genid = () => randomUUID();
    }
  }
}

/**
 * extend context prototype, add session properties
 *
 * @param  {Object} context koa's context prototype
 * @param  {Object} opts session options
 */
function extendContext(context: object, opts: SessionOptions) {
  if (context.hasOwnProperty(GET_CONTEXT_SESSION)) {
    return;
  }
  Object.defineProperties(context, {
    [GET_CONTEXT_SESSION]: {
      get() {
        if (this[CONTEXT_SESSION_INSTANCE]) {
          return this[CONTEXT_SESSION_INSTANCE];
        }
        this[CONTEXT_SESSION_INSTANCE] = new ContextSession(this, opts);
        return this[CONTEXT_SESSION_INSTANCE];
      },
    },
    session: {
      get() {
        return this[GET_CONTEXT_SESSION].get();
      },
      set(val) {
        this[GET_CONTEXT_SESSION].set(val);
      },
      configurable: true,
    },
    sessionOptions: {
      get() {
        return this[GET_CONTEXT_SESSION].opts;
      },
    },
  });
}
