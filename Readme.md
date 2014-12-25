# koa-session

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
  var n = this.session.views || 0;
  this.session.views = ++n;
  this.body = n + ' views';
})

app.listen(3000);
console.log('listening on port 3000');
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
