'use strict';

const Koa = require('koa');
const request = require('supertest');
const should = require('should');
const session = require('..');
const store = require('./store_with_ctx');
const pedding = require('pedding');
const assert = require('assert');
const sleep = require('mz-modules/sleep');

describe('Koa Session External Store methods can acceess Koa context', () => {
  let cookie;

  describe('new session', () => {
    describe('when not accessed', () => {
      it('should not set ctx.state.test variable', async () => {
        const app = App();

        request(app.callback())
          .get('/')
          .expect('undefined');
      });
    });

    describe('when populated', () => {
      it('should set ctx.state.test variable', done => {
        const app = App();

        app.use(async ctx => {
          if (ctx.path === '/set') ctx.session = { foo: 'bar' };
        });

        request(app.listen())
        .get('/set')
        .expect(200, (err, res) => {
          if (err) return done(err);
          cookie = res.header['set-cookie'].join(';');
          res.text.should.equal('set');
          done();
        });
      });
    });

    describe('when accessed', () => {
      it('should access ctx.state.test variable', async () => {
        const app = App();

        request(app.callback())
          .get('/')
          .set('Cookie', cookie)
          .expect('get');
      });
    });

    describe('session destroyed', () => {
      it('should access ctx.state.test variable', async () => {
        const app = App();

        app.use(async ctx => {
          if (ctx.path === '/destroy') ctx.session = null;
        });

        request(app.callback())
          .get('/destroy')
          .set('Cookie', cookie)
          .expect('destroyed');
      });
    });
  });
});

function App(options) {
  const app = new Koa();
  app.keys = [ 'a', 'b' ];
  options = options || {};
  options.store = store;
  app.use(async (ctx, next) => {
    await next();
    ctx.body = ctx.state.test === undefined ? 'undefined' : ctx.state.test;
  });

  app.use(session(options, app));
  return app;
}
