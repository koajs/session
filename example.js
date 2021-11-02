
var session = require('./');
var Koa = require('koa');
var app = new Koa();

app.keys = ['some secret hurr'];

app.use(session(app));

app.use(function(ctx, next){
  if ('/favicon.ico' == ctx.path) return;
  var n = ctx.session.views || 0;
  ctx.session.views = ++n;
  ctx.body = n + ' views';
});

app.listen(3000);
console.log('listening on port 3000');
