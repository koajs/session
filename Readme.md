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
app.use(session());

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
  to "koa:sess". All other options are passed to `ctx.cookie.get()` and
  `ctx.cookie.set()` allowing you to control security, domain, path,
  and signing among other settings.

### Session#isNew

  Returns __true__ if the session is new.

### Destroying a session

  To destroy a session simply set it to `null`:

```js
this.session = null;
```

## License

  MIT
