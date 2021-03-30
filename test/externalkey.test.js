'use strict';
const Koa = require('koa');
const request = require('supertest');
const assert = require('assert');
const session = require('..');
const store = require('./store');
const TOKEN_KEY = 'User-Token';

describe('Koa Session External Key', () => {
  describe('when the external key set/get is invalid', () => {
    it('should throw a error', () => {
      try {
        new App({
          externalKey: {},
        });
      } catch (err) {
        assert.equal(err.message, 'externalKey.get must be function');
      }
    });
  });
  describe('custom get/set external key', () => {
    it('should still work', done => {
      const app = App();
      app.use(async function(ctx) {
        if (ctx.method === 'POST') {
          ctx.session.string = ';';
          ctx.status = 204;
          assert(ctx.session.externalKey);
        } else {
          ctx.body = ctx.session.string;
          assert(ctx.session.externalKey === ctx.get(TOKEN_KEY));
        }
      });
      const server = app.listen();
      request(server)
        .post('/')
        .expect(204, (err, res) => {
          if (err) return done(err);
          const token = res.get(TOKEN_KEY);
          request(server)
            .get('/')
            .set(TOKEN_KEY, token)
            .expect(';', done);
        });
    });
  });
});
function App(options) {
  const app = new Koa();
  app.keys = [ 'a', 'b' ];
  options = options || {};
  options.store = store;
  options.externalKey = options.externalKey || {
    get: ctx => ctx.get(TOKEN_KEY),
    set: (ctx, value) => ctx.set(TOKEN_KEY, value),
  };
  app.use(session(options, app));
  return app;
}
