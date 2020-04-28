# koa-session

[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Test coverage][coveralls-image]][coveralls-url]
[![Gittip][gittip-image]][gittip-url]
[![David deps][david-image]][david-url]
[![iojs version][iojs-image]][iojs-url]
[![node version][node-image]][node-url]
[![npm download][download-image]][download-url]

[npm-image]: https://img.shields.io/npm/v/koa-session.svg?style=flat-square
[npm-url]: https://npmjs.org/package/koa-session
[travis-image]: https://img.shields.io/travis/koajs/session.svg?style=flat-square
[travis-url]: https://travis-ci.org/koajs/session
[coveralls-image]: https://img.shields.io/coveralls/koajs/session.svg?style=flat-square
[coveralls-url]: https://coveralls.io/r/koajs/session?branch=master
[gittip-image]: https://img.shields.io/gittip/fengmk2.svg?style=flat-square
[gittip-url]: https://www.gittip.com/fengmk2/
[david-image]: https://img.shields.io/david/koajs/session.svg?style=flat-square
[david-url]: https://david-dm.org/koajs/session
[iojs-image]: https://img.shields.io/badge/io.js-%3E=_1.0-yellow.svg?style=flat-square
[iojs-url]: http://iojs.org/
[node-image]: https://img.shields.io/badge/node.js-%3E=_7.6-green.svg?style=flat-square
[node-url]: http://nodejs.org/download/
[download-image]: https://img.shields.io/npm/dm/koa-session.svg?style=flat-square
[download-url]: https://npmjs.org/package/koa-session

 Simple session middleware for Koa. Defaults to cookie-based sessions and supports external stores.

 *Requires Node 7.6 or greater for async/await support*

## Installation

```js
$ npm install koa-session
```

## Notice

6.x changed the default cookie key from `koa:sess` to `koa.sess` to ensure `set-cookie` value valid with HTTP spec.[see issue](https://github.com/koajs/session/issues/28). If you want to be compatible with the previous version, you can manually set `config.key` to `koa:sess`.

## Example

  View counter example:

```js
const session = require('koa-session');
const Koa = require('koa');
const app = new Koa();

app.keys = ['some secret hurr'];

const CONFIG = {
  key: 'koa.sess', /** (string) cookie key (default is koa.sess) */
  /** (number || 'session') maxAge in ms (default is 1 days) */
  /** 'session' will result in a cookie that expires when session/browser is closed */
  /** Warning: If a session cookie is stolen, this cookie will never expire */
  maxAge: 86400000,
  autoCommit: true, /** (boolean) automatically commit headers (default true) */
  overwrite: true, /** (boolean) can overwrite or not (default true) */
  httpOnly: true, /** (boolean) httpOnly or not (default true) */
  signed: true, /** (boolean) signed or not (default true) */
  rolling: false, /** (boolean) Force a session identifier cookie to be set on every response. The expiration is reset to the original maxAge, resetting the expiration countdown. (default is false) */
  renew: false, /** (boolean) renew session when session is nearly expired, so we can always keep user logged in. (default is false)*/
  secure: true, /** (boolean) secure cookie*/
  sameSite: null, /** (string) session cookie sameSite options (default null, don't set it) */
};

app.use(session(CONFIG, app));
// or if you prefer all default config, just use => app.use(session(app));

app.use(ctx => {
  // ignore favicon
  if (ctx.path === '/favicon.ico') return;

  let n = ctx.session.views || 0;
  ctx.session.views = ++n;
  ctx.body = n + ' views';
});

app.listen(3000);
console.log('listening on port 3000');
```

## API

### Options

  The cookie name is controlled by the `key` option, which defaults
  to "koa.sess". All other options are passed to `ctx.cookies.get()` and
  `ctx.cookies.set()` allowing you to control security, domain, path,
  and signing among other settings.

#### Custom `encode/decode` Support

  Use `options.encode` and `options.decode` to customize your own encode/decode methods.

### Hooks

  - `valid()`: valid session value before use it
  - `beforeSave()`: hook before save session

### External Session Stores

  The session is stored in a cookie by default, but it has some disadvantages:

  - Session is stored on client side unencrypted
  - [Browser cookies always have length limits](http://browsercookielimits.squawky.net/)


  You can store the session content in external stores (Redis, MongoDB or other DBs) by passing `options.store` with three methods (these need to be async functions):

  - `get(key, maxAge, { rolling })`: get session object by key
  - `set(key, sess, maxAge, { rolling, changed })`: set session object for key, with a `maxAge` (in ms)
  - `destroy(key)`: destroy session for key


  Once you pass `options.store`, session storage is dependent on your external store -- you can't access the session if your external store is down. **Use external session stores only if necessary, avoid using session as a cache, keep the session lean, and store it in a cookie if possible!**


  The way of generating external session id is controlled by the `options.genid(ctx)`, which defaults to `uuid.v4()`.

  If you want to add prefix for all external session id, you can use `options.prefix`, it will not work if `options.genid(ctx)` present.

  If your session store requires data or utilities from context, `opts.ContextStore` is also supported. `ContextStore` must be a class which claims three instance methods demonstrated above. `new ContextStore(ctx)` will be executed on every request.

### Events

`koa-session` will emit event on `app` when session expired or invalid:

- `session:missed`: can't get session value from external store.
- `session:invalid`: session value is invalid.
- `session:expired`: session value is expired.

### Custom External Key

External key is used the cookie by default, but you can use `options.externalKey` to customize your own external key methods. `options.externalKey` with two methods:

- `get(ctx)`: get the external key
- `set(ctx, value)`: set the external key

### Session#isNew

  Returns __true__ if the session is new.

```js
if (this.session.isNew) {
  // user has not logged in
} else {
  // user has already logged in
}
```

### Session#maxAge

  Get cookie's maxAge.

### Session#maxAge=

  Set cookie's maxAge.

### Session#save()

  Save this session no matter whether it is populated.

### Session#manuallyCommit()

  Session headers are auto committed by default. Use this if `autoCommit` is set to `false`.

### Destroying a session

  To destroy a session simply set it to `null`:

```js
this.session = null;
```

## License

  MIT
