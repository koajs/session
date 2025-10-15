import { strict as assert } from 'node:assert';
import Koa from 'koa';
import { ZodError } from 'zod';
import { request } from '@eggjs/supertest';
import session, { type CreateSessionOptions } from '../src/index.js';
import store from './store.js';

const TOKEN_KEY = 'User-Token';

function App(options: CreateSessionOptions = {}) {
  const app = new Koa();
  app.keys = [ 'a', 'b' ];
  options.store = store;
  options.externalKey = options.externalKey ?? {
    get: (ctx: any) => ctx.get(TOKEN_KEY),
    set: (ctx: any, value: any) => ctx.set(TOKEN_KEY, value),
  };
  app.use(session(options, app));
  return app;
}

describe('Koa Session External Key', () => {
  describe('when the external key set/get is invalid', () => {
    it('should throw a error', () => {
      assert.throws(() => {
        App({
          externalKey: {} as any,
        });
      }, err => {
        assert(err instanceof ZodError);
        assert.match(err.message, /expected function, received undefined/);
        return true;
      });
    });
  });

  describe('custom get/set external key', () => {
    it('should still work', async () => {
      const app = App();
      app.use(async function(ctx) {
        if (ctx.method === 'POST') {
          ctx.session.string = ';';
          ctx.status = 204;
          assert(ctx.session.externalKey);
        } else {
          ctx.body = ctx.session.string;
          assert.equal(ctx.session.externalKey, ctx.get(TOKEN_KEY));
        }
      });
      const res = await request(app.callback())
        .post('/')
        .expect(204);
      const token = res.get(TOKEN_KEY)!;
      await request(app.callback())
        .get('/')
        .set(TOKEN_KEY as any, token)
        .expect(';');
    });
  });
});
