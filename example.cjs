
const Koa = require('koa');
const { createSession } = require('./');

const app = new Koa();

app.keys = [ 'some secret hurr' ];

app.use(createSession(app));

app.use(async (ctx, next) => {
  if (ctx.path === '/favicon.ico') return next();

  let n = ctx.session.views || 0;
  ctx.session.views = ++n;
  ctx.body = n + ' views';
});

app.listen(3000);
console.log('listening on port http://localhost:3000');
