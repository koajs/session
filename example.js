
var session = require('./');
var Koa = require('koa');
var Keygrip = require('keygrip');
var app = new Koa();

app.keys = new Keygrip(['insert 64 bytes random string', 'insert another 64 bytes random string'], 'sha512');

app.use(session(app));

app.use(function* (next){
  if ('/favicon.ico' == this.path) return;
  var n = this.session.views || 0;
  this.session.views = ++n;
  this.body = n + ' views';
});

app.listen(3000);
console.log('listening on port 3000');
