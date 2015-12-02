# koa-session

[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Test coverage][codecov-image]][codecov-url]
[![David deps][david-image]][david-url]
[![npm download][download-image]][download-url]

[npm-image]: https://img.shields.io/npm/v/koa-session.svg?style=flat-square
[npm-url]: https://npmjs.org/package/koa-session
[travis-image]: https://img.shields.io/travis/koajs/session.svg?style=flat-square
[travis-url]: https://travis-ci.org/koajs/session
[codecov-image]: https://codecov.io/github/koajs/session/coverage.svg?branch=master
[codecov-url]: https://codecov.io/github/koajs/session?branch=master
[david-image]: https://img.shields.io/david/koajs/session.svg?style=flat-square
[david-url]: https://david-dm.org/koajs/session
[download-image]: https://img.shields.io/npm/dm/koa-session.svg?style=flat-square
[download-url]: https://npmjs.org/package/koa-session

Simple cookie-based session middleware for Koa.

## Installation

```js
$ npm install koa-session
```

## Example

View counter example:

```js
var session = require('koa-session');
var koa = require('koa');
var app = koa();

app.keys = ['some secret hurr'];
app.use(session(app));

app.use(function *(){
  // ignore favicon
  if (this.path === '/favicon.ico') return;

  var n = this.session.views || 0;
  this.session.views = ++n;
  this.body = n + ' views';
})

app.listen(3000);
console.log('listening on port 3000');
```
For Koa 2, use [koa-convert](https://github.com/gyson/koa-convert) to convert the session middleware :

```js
const koa = require('koa');
const session = require('koa-session')
const convert = require('koa-convert');

const app = new koa();
app.use(convert(session(app)));

// codes
```

## Semantics

  This module provides "guest" sessions, meaning any visitor will have a session,
  authenticated or not. If a session is _new_ a Set-Cookie will be produced regardless
  of populating the session.

## API

### Options

  The cookie name is controlled by the `key` option, which defaults
  to "koa:sess". All other options are passed to `ctx.cookies.get()` and
  `ctx.cookies.set()` allowing you to control security, domain, path,
  and signing among other settings.

#### Custom `encode/decode` Support

  Use `options.encode` and `options.decode` to customize your own encode/decode methods.

### Hooks

  - `valid()`: valid session value before use it
  - `beforeSave()`: hook before save session

### Session#isNew

  Returns __true__ if the session is new.

### Session#maxAge

  Get cookie's maxAge.

### Session#maxAge=

  Set cookie's maxAge.

### Destroying a session

  To destroy a session simply set it to `null`:

```js
this.session = null;
```

## Session Stores

  This module only supports cookie sessions. There are many other modules listed in [koa's wiki](https://github.com/koajs/koa/wiki#wiki-sessions) for sessions that use database storage. Unlike Connect 2.x's session middleware, there is no main "session" middleware that you plugin different stores - each store is a completely different module.

  If you're interested in creating your own koa session store, feel free to fork/extend this repository and add additional tests. At a minimum, it __should__ pass this repositories' tests that apply. Ideally, there would be a central repository with specifications and tests for all koa sessions, which would allow interoperability and consistency between session modules. If you're interested in working on such a project, let us know!

## License

  MIT
