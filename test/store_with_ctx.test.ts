import { strict as assert } from 'node:assert';
import Koa from 'koa';
import { request } from '@eggjs/supertest';
import session, { type CreateSessionOptions } from '../src/index.js';
import store from './store_with_ctx.js';

function App(options: CreateSessionOptions = {}) {
  const app = new Koa();
  app.keys = [ 'a', 'b' ];
  options.store = store;
  app.use(async (ctx, next) => {
    await next();
    ctx.body = ctx.state.test === undefined ? 'undefined' : ctx.state.test;
  });

  app.use(session(options, app));
  return app;
}

describe('Koa Session External Store methods can access Koa context', () => {
  let cookie: string;

  describe('new session', () => {
    describe('when not accessed', () => {
      it('should not set ctx.state.test variable', async () => {
        const app = App();

        await request(app.callback())
          .get('/')
          .expect('undefined');
      });
    });

    describe('when populated', () => {
      it('should set ctx.state.test variable', async () => {
        const app = App();

        app.use(async ctx => {
          if (ctx.path === '/set') ctx.session = { foo: 'bar' };
        });

        const res = await request(app.callback())
          .get('/set')
          .expect(200);
        cookie = res.get('Set-Cookie')!.join(';');
        assert.equal(res.text, 'set');
      });
    });

    describe('when accessed', () => {
      it('should access ctx.state.test variable', async () => {
        const app = App();

        await request(app.callback())
          .get('/')
          .set('Cookie', cookie)
          .expect('get');
      });
    });

    describe('session destroyed', () => {
      it('should access ctx.state.test variable', async () => {
        const app = App();

        app.use(async ctx => {
          if (ctx.path === '/destroy') {
            ctx.session = null;
          }
        });

        await request(app.callback())
          .get('/destroy')
          .set('Cookie', cookie)
          .expect('destroyed');
      });
    });
  });
});
