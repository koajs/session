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
        assert.equal(err.code, 'ERR_ASSERTION');
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
        } else {
          ctx.body = ctx.session.string;
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
  options.key = TOKEN_KEY;
  options.externalKey = options.externalKey || {
    get: (key, opts, ctx) => ctx.get(key),
    set: (key, value, opts, ctx) => ctx.set(key, value),
  };
  app.use(session(options, app));
  return app;
}
