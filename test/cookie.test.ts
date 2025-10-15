import { strict as assert } from 'node:assert';
import Koa from 'koa';
import { request } from '@eggjs/supertest';
import session, { type CreateSessionOptions } from '../src/index.js';

function App(options: CreateSessionOptions = {}) {
  const app = new Koa();
  app.keys = [ 'a', 'b' ];
  app.use(session(options, app));
  return app;
}

const inspect = Symbol.for('nodejs.util.inspect.custom');

describe('Koa Session Cookie', () => {
  let cookie: string;

  describe('when options.signed = true', () => {
    describe('when app.keys are set', () => {
      it('should work', async () => {
        const app = new Koa();

        app.keys = [ 'a', 'b' ];
        app.use(session({}, app));

        app.use(async (ctx: Koa.Context) => {
          ctx.session!.message = 'hi';
          ctx.body = ctx.session;
        });

        await request(app.callback())
          .get('/')
          .expect(200);
      });
    });

    describe('when app.keys are not set', () => {
      it('should throw and clean this cookie', async () => {
        const app = new Koa();

        app.use(session(app));

        app.use(async (ctx: Koa.Context) => {
          ctx.session!.message = 'hi';
          ctx.body = ctx.session;
        });

        await request(app.callback())
          .get('/')
          .expect(500);
      });
    });

    describe('when app not set', () => {
      it('should throw', () => {
        const app = new Koa();
        assert.throws(() => {
          app.use((session as any)());
        }, /app instance required: `session\(opts, app\)`/);
        assert.throws(() => {
          app.use(session({}));
        }, /app instance required: `session\(opts, app\)`/);
      });
    });
  });

  describe('when options.signed = false', () => {
    describe('when app.keys are not set', () => {
      it('should work', async () => {
        const app = new Koa();

        app.use(session({ signed: false }, app));

        app.use(async (ctx: Koa.Context) => {
          ctx.session!.message = 'hi';
          ctx.body = ctx.session;
        });

        await request(app.callback())
          .get('/')
          .expect(200);
      });
    });
  });

  describe('when the session contains a ;', () => {
    it('should still work', async () => {
      const app = App();

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
      // samesite is not set
      assert(!cookie.join(';').includes('samesite'));
      await request(server)
        .get('/')
        .set('Cookie', cookie.join(';'))
        .expect(';');
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
        assert.equal(res.header['set-cookie'], undefined);
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
        assert.equal(res.header['set-cookie'], undefined);
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
        assert.equal(res.header['set-cookie'], undefined);
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
        assert.equal(res.header['set-cookie'], undefined);
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
        assert.equal(res.header['set-cookie'], undefined);
      });
    });

    describe('when accessed and changed', () => {
      it('should Set-Cookie', async () => {
        const app = App();

        app.use(async (ctx: Koa.Context) => {
          ctx.session!.money = '$$$';
          ctx.body = 'aklsdjflasdjf';
        });

        const res = await request(app.callback())
          .get('/')
          .set('Cookie', cookie)
          .expect('Set-Cookie', /koa\.sess/)
          .expect(200);
        const newCookie = res.get('Set-Cookie')!;
        // samesite is not set
        assert(!newCookie.join(';').includes('samesite'));
      });
    });
  });

  describe('after session set to null with signed cookie', () => {
    it('should return expired cookies', async () => {
      const app = App({
        signed: true,
      });

      app.use(async (ctx: Koa.Context) => {
        ctx.session!.hello = {};
        ctx.session = null;
        ctx.body = String(ctx.session === null);
      });

      await request(app.callback())
        .get('/')
        .expect('Set-Cookie',
          /koa\.sess=; path=\/; expires=Thu, 01 Jan 1970 00:00:00 GMT/)
        .expect('Set-Cookie',
          /koa\.sess.sig=(.*); path=\/; expires=Thu, 01 Jan 1970 00:00:00 GMT/)
        .expect('true')
        .expect(200);
    });
  });

  describe('after session set to null without signed cookie', () => {
    it('should return expired cookies', async () => {
      const app = App({
        signed: false,
      });

      app.use(async (ctx: Koa.Context) => {
        ctx.session!.hello = {};
        ctx.session = null;
        ctx.body = String(ctx.session === null);
      });

      await request(app.callback())
        .get('/')
        .expect('Set-Cookie', /koa\.sess=; path=\/; expires=Thu, 01 Jan 1970 00:00:00 GMT/)
        .expect('true')
        .expect(200);
    });
  });

  describe('when get session after set to null', () => {
    it('should return null', async () => {
      const app = App();

      app.use(async (ctx: Koa.Context) => {
        ctx.session!.hello = {};
        ctx.session = null;
        ctx.body = String(ctx.session === null);
      });

      await request(app.callback())
        .get('/')
        .expect('Set-Cookie', /koa\.sess=;/)
        .expect('true')
        .expect(200);
    });
  });

  describe('when decode session', () => {
    describe('SyntaxError', () => {
      it('should create new session', async () => {
        const app = App({ signed: false });

        app.use(async (ctx: Koa.Context) => {
          ctx.body = String(ctx.session.isNew);
        });

        await request(app.callback())
          .get('/')
          .set('cookie', 'koa.sess=invalid-session;')
          .expect('true')
          .expect(200);
      });
    });

    describe('Other Error', () => {
      it('should throw', async () => {
        const app = App({
          signed: false,
          decode() {
            throw new Error('decode error');
          },
        });

        app.use(async (ctx: Koa.Context) => {
          ctx.body = String(ctx.session!.isNew);
        });

        await request(app.callback())
          .get('/')
          .set('cookie', 'koa.sess=invalid-session;')
          .expect('Set-Cookie', /koa\.sess=;/)
          .expect(500);
      });
    });
  });

  describe('when encode session error', () => {
    it('should throw', async () => {
      const app = App({
        encode() {
          throw new Error('encode error');
        },
      });

      app.use(async (ctx: Koa.Context) => {
        ctx.session!.foo = 'bar';
        ctx.body = 'hello';
      });

      app.once('error', (err, ctx) => {
        assert.equal(err.message, 'encode error');
        assert(ctx);
      });

      await request(app.callback())
        .get('/')
        .expect(500);
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
        assert.equal(res.header['set-cookie'], undefined);
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
          .expect(/Internal Server Error/)
          .expect(500);
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

      app.use(session(app));

      app.use(async (ctx: Koa.Context, next: Koa.Next) => {
        ctx.session.name = 'funny';
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

        app.use(async (ctx: Koa.Context) => {
          if (ctx.method === 'POST') {
            ctx.session!.message = 'hi';
            ctx.status = 200;
            return;
          }

          ctx.body = ctx.session.message || '';
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

  describe('when get session before enter session middleware', () => {
    it('should work', async () => {
      const app = new Koa();

      app.keys = [ 'a', 'b' ];
      app.use(async (ctx: Koa.Context, next: Koa.Next) => {
        ctx.session!.foo = 'hi';
        await next();
      });
      app.use(session({}, app));
      app.use(async (ctx: Koa.Context) => {
        ctx.body = ctx.session;
      });

      const res = await request(app.callback())
        .get('/')
        .expect(200);

      const cookies = res.get('Set-Cookie')!.join(';');
      assert(cookies.includes('koa.sess='));

      await request(app.callback())
        .get('/')
        .set('Cookie', cookies)
        .expect(200);
    });
  });

  describe('options.sameSite', () => {
    it('should return opt.sameSite=none', async () => {
      const app = App({ sameSite: 'none' });

      app.use(async (ctx: Koa.Context) => {
        ctx.session = { foo: 'bar' };
        ctx.body = ctx.session.foo;
      });

      const res = await request(app.callback())
        .get('/')
        .expect('bar')
        .expect(200);
      const cookie = res.get('Set-Cookie')!.join('|');
      assert(cookie.includes('path=/; samesite=none; httponly'));
    });

    it('should return opt.sameSite=lax', async () => {
      const app = App({ sameSite: 'lax' });

      app.use(async (ctx: Koa.Context) => {
        ctx.session = { foo: 'bar' };
        ctx.body = ctx.session.foo;
      });

      const res = await request(app.callback())
        .get('/')
        .expect('bar')
        .expect(200);
      const cookie = res.get('Set-Cookie')!.join('|');
      assert(cookie.includes('path=/; samesite=lax; httponly'));
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

      const res = await request(app.callback())
        .get('/')
        .set('Cookie', 'uid=123')
        .expect(200);

      const data = res.body;
      const cookies = res.get('Set-Cookie')!.join(';');
      assert(cookies.includes('koa.sess='));

      await request(app.callback())
        .get('/')
        .set('Cookie', cookies + ';uid=123')
        .expect(200)
        .expect(data);

      // should ignore uid:123 session and create a new session for uid:456
      const res2 = await request(app.callback())
        .get('/')
        .set('Cookie', cookies + ';uid=456')
        .expect(200);

      assert.equal(res2.body.uid, '456');
      assert.notEqual(res2.body.foo, data.foo);
    });
  });

  describe('when options.encode and options.decode are functions', () => {
    describe('they are used to encode/decode stored cookie values', () => {
      it('should work', async () => {
        let encodeCallCount = 0;
        let decodeCallCount = 0;

        function encode(data: any) {
          ++encodeCallCount;
          return JSON.stringify({ enveloped: data });
        }
        function decode(data: string) {
          ++decodeCallCount;
          return JSON.parse(data).enveloped;
        }

        const app = new Koa();
        app.keys = [ 'a', 'b' ];
        app.use(session({
          encode,
          decode,
        }, app));

        app.use(async (ctx: Koa.Context) => {
          ctx.session!.counter = (ctx.session!.counter || 0) + 1;
          ctx.body = ctx.session;
          return;
        });

        const res = await request(app.callback())
          .get('/')
          .expect(() => { assert(encodeCallCount > 0, 'encode was not called'); })
          .expect(200);

        assert.equal(res.body.counter, 1, 'expected body to be equal to session.counter');
        const cookies = res.get('Set-Cookie')!.join(';');
        const res2 = await request(app.callback())
          .get('/')
          .set('Cookie', cookies)
          .expect(() => { assert(decodeCallCount > 0, 'decode was not called'); })
          .expect(200);

        assert.equal(res2.body.counter, 2);
      });
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

      assert.equal(res.headers['set-cookie'], undefined);
    });

    it('should send set-cookie when session exists and not change', async () => {
      const res = await request(app.callback())
        .get('/set')
        .expect({ foo: 'bar' });

      assert.equal(res.get('Set-Cookie')!.length, 2);
      const cookie = res.get('Set-Cookie')!.join(';');
      const res2 = await request(app.callback())
        .get('/')
        .set('cookie', cookie)
        .expect({ foo: 'bar' });
      assert.equal(res2.headers['set-cookie'].length, 2);
    });
  });

  describe('init multi session middleware', () => {
    it('should work', () => {
      const app = new Koa();

      app.keys = [ 'a', 'b' ];
      const s1 = session({}, app);
      const s2 = session({}, app);
      assert(s1);
      assert(s2);
    });
  });
});
