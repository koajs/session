import { strict as assert } from 'node:assert';
import { scheduler } from 'node:timers/promises';
import Koa from 'koa';
import { request } from '@eggjs/supertest';
import { mm } from 'mm';
import session, { type CreateSessionOptions } from '../src/index.js';
import store from './store.js';

const inspect = Symbol.for('nodejs.util.inspect.custom');

function App(options: CreateSessionOptions = {}) {
  const app = new Koa();
  app.keys = [ 'a', 'b' ];
  options.store = options.store ?? store;
  app.use(session(options, app));
  return app;
}

describe('Koa Session External Store', () => {
  let cookie: string;

  describe('when the session contains a ;', () => {
    it('should still work', async () => {
      const options: CreateSessionOptions = { store };
      const app = App(options);

      app.use(async (ctx: Koa.Context) => {
        if (ctx.method === 'POST') {
          ctx.session.string = ';';
          ctx.status = 204;
        } else {
          ctx.body = ctx.session.string;
        }
      });

      const server = app.callback();
      const res = await request(server)
        .post('/')
        .expect(204);

      const cookie = res.get('Set-Cookie')!;
      await request(server)
        .get('/')
        .set('Cookie', cookie.join(';'))
        .expect(';');
    });

    it('should disable store on options', async () => {
      const options: CreateSessionOptions = { store };
      const app = App(options);

      app.use(async (ctx: Koa.Context) => {
        if (ctx.method === 'POST') {
          ctx.session.string = ';';
          ctx.status = 204;
        } else {
          ctx.body = ctx.session.string ?? 'new session create';
        }
      });

      const server = app.callback();
      const res = await request(server)
        .post('/')
        .expect(204);

      const cookie = res.get('Set-Cookie')!;
      await request(server)
        .get('/')
        .set('Cookie', cookie.join(';'))
        .expect(';');

      options.store = undefined;
      await request(server)
        .get('/')
        .set('Cookie', cookie.join(';'))
        .expect('new session create');
    });
  });

  describe('new session', () => {
    describe('when not accessed', () => {
      it('should not Set-Cookie', async () => {
        const app = App();

        app.use(async (ctx: Koa.Context) => {
          ctx.body = 'greetings';
        });

        const res = await request(app.callback())
          .get('/')
          .expect(200);

        assert(!res.headers['set-cookie']);
      });
    });

    describe('when accessed and not populated', () => {
      it('should not Set-Cookie', async () => {
        const app = App();

        app.use(async (ctx: Koa.Context) => {
          ctx.session;
          ctx.body = 'greetings';
        });

        const res = await request(app.callback())
          .get('/')
          .expect(200);

        assert(!res.headers['set-cookie']);
      });
    });

    describe('when populated', () => {
      it('should Set-Cookie', async () => {
        const app = App();

        app.use(async (ctx: Koa.Context) => {
          ctx.session!.message = 'hello';
          ctx.body = '';
        });

        const res = await request(app.callback())
          .get('/')
          .expect('Set-Cookie', /koa\.sess/)
          .expect(200);

        cookie = res.get('Set-Cookie')!.join(';');
      });

      it('should not Set-Cookie', async () => {
        const app = App();

        app.use(async (ctx: Koa.Context) => {
          ctx.body = ctx.session;
        });

        const res = await request(app.callback())
          .get('/')
          .expect(200);

        assert(!res.headers['set-cookie']);
      });
    });
  });

  describe('saved session', () => {
    describe('when not accessed', () => {
      it('should not Set-Cookie', async () => {
        const app = App();

        app.use(async (ctx: Koa.Context) => {
          ctx.body = 'aklsdjflasdjf';
        });

        const res = await request(app.callback())
          .get('/')
          .set('Cookie', cookie)
          .expect(200);

        assert(!res.headers['set-cookie']);
      });
    });

    describe('when accessed but not changed', () => {
      it('should be the same session', async () => {
        const app = App();

        app.use(async (ctx: Koa.Context) => {
          assert.equal(ctx.session!.message, 'hello');
          ctx.body = 'aklsdjflasdjf';
        });

        await request(app.callback())
          .get('/')
          .set('Cookie', cookie)
          .expect(200);
      });

      it('should not Set-Cookie', async () => {
        const app = App();

        app.use(async (ctx: Koa.Context) => {
          assert.equal(ctx.session!.message, 'hello');
          ctx.body = 'aklsdjflasdjf';
        });

        const res = await request(app.callback())
          .get('/')
          .set('Cookie', cookie)
          .expect(200);

        assert(!res.headers['set-cookie']);
      });
    });

    describe('when accessed and changed', () => {
      it('should Set-Cookie', async () => {
        const app = App();

        app.use(async (ctx: Koa.Context) => {
          ctx.session!.money = '$$$';
          ctx.body = 'aklsdjflasdjf';
        });

        await request(app.callback())
          .get('/')
          .set('Cookie', cookie)
          .expect('Set-Cookie', /koa\.sess/)
          .expect(200);
      });
    });
  });

  describe('when session is', () => {
    describe('null', () => {
      it('should expire the session', async () => {
        const app = App();

        app.use(async (ctx: Koa.Context) => {
          ctx.session = null;
          ctx.body = 'asdf';
        });

        await request(app.callback())
          .get('/')
          .expect('Set-Cookie', /koa\.sess/)
          .expect(200);
      });
    });

    describe('an empty object', () => {
      it('should not Set-Cookie', async () => {
        const app = App();

        app.use(async (ctx: Koa.Context) => {
          ctx.session = {};
          ctx.body = 'asdf';
        });

        const res = await request(app.callback())
          .get('/')
          .expect(200);

        assert(!res.headers['set-cookie']);
      });
    });

    describe('an object', () => {
      it('should create a session', async () => {
        const app = App();

        app.use(async (ctx: Koa.Context) => {
          ctx.session = { message: 'hello' };
          ctx.body = 'asdf';
        });

        await request(app.callback())
          .get('/')
          .expect('Set-Cookie', /koa\.sess/)
          .expect(200);
      });
    });

    describe('anything else', () => {
      it('should throw', async () => {
        const app = App();

        app.use(async (ctx: Koa.Context) => {
          ctx.session = 'asdf';
        });

        await request(app.callback())
          .get('/')
          .expect(500);
      });
    });
  });

  describe('session', () => {
    describe('.inspect()', () => {
      it('should return session content', async () => {
        const app = App();

        app.use(async (ctx: Koa.Context) => {
          ctx.session!.foo = 'bar';
          ctx.body = ctx.session![inspect]();
        });

        await request(app.callback())
          .get('/')
          .expect('Set-Cookie', /koa\.sess=.+;/)
          .expect({ foo: 'bar' })
          .expect(200);
      });
    });

    describe('.length', () => {
      it('should return session length', async () => {
        const app = App();

        app.use(async (ctx: Koa.Context) => {
          ctx.session!.foo = 'bar';
          ctx.body = String(ctx.session!.length);
        });

        await request(app.callback())
          .get('/')
          .expect('Set-Cookie', /koa\.sess=.+;/)
          .expect('1')
          .expect(200);
      });
    });

    describe('.populated', () => {
      it('should return session populated', async () => {
        const app = App();

        app.use(async (ctx: Koa.Context) => {
          ctx.session!.foo = 'bar';
          ctx.body = String(ctx.session!.populated);
        });

        await request(app.callback())
          .get('/')
          .expect('Set-Cookie', /koa\.sess=.+;/)
          .expect('true')
          .expect(200);
      });
    });

    describe('.save()', () => {
      it('should save session', async () => {
        const app = App();

        app.use(async (ctx: Koa.Context) => {
          ctx.session!.save();
          ctx.body = 'hello';
        });

        await request(app.callback())
          .get('/')
          .expect('Set-Cookie', /koa\.sess=.+;/)
          .expect('hello')
          .expect(200);
      });
    });
  });

  describe('when an error is thrown downstream and caught upstream', () => {
    it('should still save the session', async () => {
      const app = new Koa();

      app.keys = [ 'a', 'b' ];

      app.use(async (ctx: Koa.Context, next: Koa.Next) => {
        try {
          await next();
        } catch (err: any) {
          ctx.status = err.status;
          ctx.body = err.message;
        }
      });

      app.use(session({ store }, app));

      app.use(async (ctx: Koa.Context, next: Koa.Next) => {
        ctx.session!.name = 'funny';
        await next();
      });

      app.use(async (ctx: Koa.Context) => {
        ctx.throw(401);
      });

      await request(app.callback())
        .get('/')
        .expect('Set-Cookie', /koa\.sess/)
        .expect(401);
    });
  });

  describe('when maxAge present', () => {
    describe('and set to be a session cookie', () => {
      it('should not expire the session', async () => {
        const app = App({ maxAge: 'session' });

        app.use(async (ctx: Koa.Context) => {
          if (ctx.method === 'POST') {
            ctx.session!.message = 'hi';
            ctx.body = 200;
            return;
          }
          ctx.body = ctx.session!.message;
        });

        const server = app.callback();
        const res = await request(server)
          .post('/')
          .expect('Set-Cookie', /koa\.sess/);

        const cookie = res.get('Set-Cookie')!.join(';');
        assert(!cookie.includes('expires='));

        await request(server)
          .get('/')
          .set('cookie', cookie)
          .expect('hi');
      });
    });

    describe('and not expire', () => {
      it('should not expire the session', async () => {
        const app = App({ maxAge: 100 });

        app.use(async (ctx: Koa.Context) => {
          if (ctx.method === 'POST') {
            ctx.session!.message = 'hi';
            ctx.body = 200;
            return;
          }
          ctx.body = ctx.session!.message;
        });

        const server = app.callback();
        const res = await request(server)
          .post('/')
          .expect('Set-Cookie', /koa\.sess/);

        const cookie = res.get('Set-Cookie')!.join(';');

        await request(server)
          .get('/')
          .set('cookie', cookie)
          .expect('hi');
      });
    });

    describe('and expired', () => {
      it('should expire the sess', async () => {
        const app = App({ maxAge: 100 });
        app.on('session:expired', args => {
          assert(args.key.match(/^\w+-/));
          assert(args.value);
          assert(args.ctx);
        });

        app.use(async (ctx: Koa.Context) => {
          if (ctx.method === 'POST') {
            ctx.session!.message = 'hi';
            ctx.status = 200;
            return;
          }

          ctx.body = ctx.session!.message || '';
        });

        const server = app.callback();
        const res = await request(server)
          .post('/')
          .expect('Set-Cookie', /koa\.sess/);

        const cookie = res.get('Set-Cookie')!.join(';');

        await new Promise(resolve => setTimeout(resolve, 200));

        await request(server)
          .get('/')
          .set('cookie', cookie)
          .expect('');
      });
    });
  });

  describe('ctx.session.maxAge', () => {
    it('should return opt.maxAge', async () => {
      const app = App({ maxAge: 100 });

      app.use(async (ctx: Koa.Context) => {
        ctx.body = ctx.session!.maxAge;
      });

      await request(app.callback())
        .get('/')
        .expect('100');
    });
  });

  describe('ctx.session.maxAge=', () => {
    it('should set sessionOptions.maxAge', async () => {
      const app = App();

      app.use(async (ctx: Koa.Context) => {
        ctx.session!.foo = 'bar';
        ctx.session!.maxAge = 100;
        ctx.body = ctx.session!.foo;
      });

      await request(app.callback())
        .get('/')
        .expect('Set-Cookie', /expires=/)
        .expect(200);
    });

    it('should save even session not change', async () => {
      const app = App();

      app.use(async (ctx: Koa.Context) => {
        ctx.session!.maxAge = 100;
        ctx.body = ctx.session;
      });

      await request(app.callback())
        .get('/')
        .expect('Set-Cookie', /expires=/)
        .expect(200);
    });

    it('should save when create session only with maxAge', async () => {
      const app = App();

      app.use(async (ctx: Koa.Context) => {
        ctx.session = { maxAge: 100 };
        ctx.body = ctx.session;
      });

      await request(app.callback())
        .get('/')
        .expect('Set-Cookie', /expires=/)
        .expect(200);
    });
  });

  describe('ctx.session.regenerate', () => {
    it('should change the session key, but not content', async () => {
      const app = App();
      const message = 'hi';

      app.use(async (ctx: Koa.Context, next: Koa.Next) => {
        ctx.session = { message: 'hi' };
        await next();
      });

      app.use(async (ctx: Koa.Context, next: Koa.Next) => {
        const sessionKey = ctx.cookies.get('koa.sess');
        if (sessionKey) {
          await ctx.session!.regenerate();
        }
        await next();
      });

      app.use(async (ctx: Koa.Context) => {
        assert.equal(ctx.session!.message, message);
        ctx.body = '';
      });

      let res = await request(app.callback())
        .get('/')
        .expect(200);

      const koaSession = res.get('Set-Cookie')!.join(';');
      assert.match(koaSession, /koa\.sess=/);
      res = await request(app.callback())
        .get('/')
        .set('Cookie', koaSession)
        .expect(200);

      const cookies = res.get('Set-Cookie')!.join(';');
      assert.match(cookies, /koa\.sess=/);
      assert.notEqual(cookies, koaSession);
    });
  });

  describe('when store return empty', () => {
    it('should create new Session', async () => {
      const app = App({ signed: false });

      app.use(async (ctx: Koa.Context) => {
        ctx.body = String(ctx.session!.isNew);
      });

      app.on('session:missed', args => {
        assert.equal(args.key, 'invalid-key');
        assert(args.ctx);
      });

      await request(app.callback())
        .get('/')
        .set('cookie', 'koa.sess=invalid-key')
        .expect('true')
        .expect(200);
    });
  });

  describe('when valid and beforeSave set', () => {
    it('should ignore session when uid changed', async () => {
      const app = new Koa();

      app.keys = [ 'a', 'b' ];
      app.use(session({
        valid(ctx: any, sess: any) {
          return ctx.cookies.get('uid') === sess.uid;
        },
        beforeSave(ctx: any, sess: any) {
          sess.uid = ctx.cookies.get('uid');
        },
        store,
      }, app));

      app.use(async (ctx: Koa.Context) => {
        if (!ctx.session!.foo) {
          ctx.session!.foo = Date.now() + '|uid:' + ctx.cookies.get('uid');
        }

        ctx.body = {
          foo: ctx.session!.foo,
          uid: ctx.cookies.get('uid'),
        };
      });

      app.on('session:invalid', args => {
        assert(args.key);
        assert(args.value);
        assert(args.ctx);
      });

      let res = await request(app.callback())
        .get('/')
        .set('Cookie', 'uid=123')
        .expect(200);

      const data = res.body;
      const cookies = res.get('Set-Cookie')!.join(';');
      assert(cookies.includes('koa.sess='));

      res = await request(app.callback())
        .get('/')
        .set('Cookie', cookies + ';uid=123')
        .expect(200);

      assert.deepEqual(res.body, data);

      res = await request(app.callback())
        .get('/')
        .set('Cookie', cookies + ';uid=456')
        .expect(200);

      assert.equal(res.body.uid, '456');
      assert.notEqual(res.body.foo, data.foo);
    });
  });

  describe('ctx.session', () => {
    after(mm.restore);

    it('can be mocked', async () => {
      const app = App();

      app.use(async (ctx: Koa.Context) => {
        ctx.body = ctx.session;
      });

      mm(app.context, 'session', {
        foo: 'bar',
      });

      await request(app.callback())
        .get('/')
        .expect({
          foo: 'bar',
        })
        .expect(200);
    });
  });

  describe('when rolling set to true', () => {
    let app: Koa;
    before(() => {
      app = App({ rolling: true });

      app.use(async (ctx: Koa.Context) => {
        if (ctx.path === '/set') ctx.session = { foo: 'bar' };
        ctx.body = ctx.session;
      });
    });

    it('should not send set-cookie when session not exists', async () => {
      const res = await request(app.callback())
        .get('/')
        .expect({});

      assert(!res.headers['set-cookie']);
    });

    it('should send set-cookie when session exists and not change', async () => {
      let res = await request(app.callback())
        .get('/set')
        .expect({ foo: 'bar' });

      assert.equal(res.headers['set-cookie'].length, 2);
      const cookie = res.get('Set-Cookie')!.join(';');

      res = await request(app.callback())
        .get('/')
        .set('cookie', cookie)
        .expect({ foo: 'bar' });

      assert.equal(res.headers['set-cookie'].length, 2);
    });
  });

  describe('when prefix present', () => {
    it('should still work', async () => {
      const app = App({ prefix: 'sess:' });

      app.use(async (ctx: Koa.Context) => {
        if (ctx.method === 'POST') {
          ctx.session!.string = ';';
          ctx.status = 204;
        } else {
          ctx.body = ctx.session!.string;
        }
      });

      const server = app.callback();
      const res = await request(server)
        .post('/')
        .expect(204);

      const cookie = res.get('Set-Cookie')!;
      assert(cookie.join().includes('koa.sess=sess:'));

      await request(server)
        .get('/')
        .set('Cookie', cookie.join(';'))
        .expect(';');
    });
  });

  describe('when renew set to true', () => {
    let app: Koa;
    before(() => {
      app = App({ renew: true, maxAge: 2000 });

      app.use(async (ctx: Koa.Context) => {
        if (ctx.path === '/set') ctx.session = { foo: 'bar' };
        ctx.body = ctx.session;
      });
    });

    it('should not send set-cookie when session not exists', async () => {
      const res = await request(app.callback())
        .get('/')
        .expect({});

      assert(!res.headers['set-cookie']);
    });

    it('should send set-cookie when session near expire and not change', async () => {
      let res = await request(app.callback())
        .get('/set')
        .expect({ foo: 'bar' });

      assert.equal(res.get('Set-Cookie')!.length, 2);
      const cookie = res.get('Set-Cookie')!.join(';');

      await scheduler.wait(1200);

      res = await request(app.callback())
        .get('/')
        .set('cookie', cookie)
        .expect({ foo: 'bar' });

      assert.equal(res.headers['set-cookie'].length, 2);
    });

    it('should not send set-cookie when session not near expire and not change', async () => {
      let res = await request(app.callback())
        .get('/set')
        .expect({ foo: 'bar' });

      assert.equal(res.headers['set-cookie'].length, 2);
      const cookie = res.get('Set-Cookie')!.join(';');

      await scheduler.wait(500);

      res = await request(app.callback())
        .get('/')
        .set('cookie', cookie)
        .expect({ foo: 'bar' });

      assert(!res.headers['set-cookie']);
    });
  });

  describe('when get session before middleware', () => {
    it('should return empty session', async () => {
      const app = new Koa();
      app.keys = [ 'a', 'b' ];
      const options = { store };

      app.use(async (ctx: Koa.Context, next: Koa.Next) => {
        assert(ctx.session);
        ctx.session.foo = '123';
        await next();
      });

      app.use(session(options, app));

      app.use(async (ctx: Koa.Context) => {
        if (ctx.path === '/set') ctx.session = { foo: 'bar' };
        ctx.body = ctx.session;
      });

      let res = await request(app.callback())
        .get('/')
        .expect({});

      res = await request(app.callback())
        .get('/set')
        .expect({ foo: 'bar' });

      const cookie = res.get('Set-Cookie')!.join(';');
      await scheduler.wait(1200);

      res = await request(app.callback())
        .get('/')
        .set('cookie', cookie)
        .expect({ foo: 'bar' });
    });
  });
});
