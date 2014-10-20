
var session = require('./');
var koa = require('koa');
var app = koa();

app.keys = ['some secret hurr'];

app.use(session());

app.use(function* (next){
  if ('/favicon.ico' == this.path) return;
  var n = this.session.views || 0;
  this.session.views = ++n;
  this.body = n + ' views';
});

app.listen(3000);
console.log('listening on port 3000');
