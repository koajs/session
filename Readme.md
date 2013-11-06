
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

app.use(session());

app.use(function(next){
  return function *(){
    var n = this.session.views || 0;
    this.session.views = ++n;
    this.session.save();
    this.body = n + ' views';
  }
})

app.listen(3000);
console.log('listening on port 3000');
```

## Options

  The cookie name is controlled by the `key` option, which defaults
  to "koa:sess". All other options are passed to `ctx.cookie.get()` and
  `ctx.cookie.set()` allowing you to control security, domain, path,
  and signing among other settings.

## License

  MIT