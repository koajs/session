
var session = require('./');
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