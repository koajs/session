import { strict as assert } from 'node:assert';
import { scheduler } from 'node:timers/promises';
import Koa from 'koa';
import { request } from '@eggjs/supertest';
import { mm } from 'mm';
import session, { type CreateSessionOptions } from '../src/index.js';
import ContextStore from './context_store.js';

const inspect = Symbol.for('nodejs.util.inspect.custom');

function App(options: CreateSessionOptions = {}) {
  const app = new Koa();
  app.keys = [ 'a', 'b' ];
  options.ContextStore = ContextStore;
  options.genid = (ctx: any) => {
    const sid = Date.now() + '_suffix';
    ctx.state.sid = sid;
    return sid;
  };
  app.use(session(options, app));
  return app;
}

describe('Koa Session External Context Store', () => {
  let cookie: string;

  describe('when the session contains a ;', () => {
    it('should still work', async () => {
      const app = App();

      app.use(async function(ctx) {
        if (ctx.method === 'POST') {
          ctx.session.string = ';';
          ctx.status = 204;
        } else {
          ctx.body = ctx.session.string;
        }
      });

      const res = await request(app.callback())
        .post('/')
        .expect(204);
      const cookie = res.get('Set-Cookie')!;
      assert(cookie, 'should have set cookie');
      await request(app.callback())
        .get('/')
        .set('Cookie', cookie.join(';'))
        .expect(';');
    });
  });

  describe('new session', () => {
    describe('when not accessed', () => {
      it('should not Set-Cookie', async () => {
        const app = App();

        app.use(async function(ctx) {
          ctx.body = 'greetings';
        });

        const res = await request(app.callback())
          .get('/')
          .expect(200);
        assert.equal(res.get('Set-Cookie'), undefined, 'should not have set cookie');
      });
    });

    describe('when accessed and not populated', () => {
      it('should not Set-Cookie', async () => {
        const app = App();

        app.use(async function(ctx) {
          ctx.session;
          ctx.body = 'greetings';
        });

        const res = await request(app.callback())
          .get('/')
          .expect(200);
        assert.equal(res.get('Set-Cookie'), undefined, 'should not have set cookie');
      });
    });

    describe('when populated', () => {
      it('should Set-Cookie', async () => {
        const app = App();

        app.use(async function(ctx) {
          ctx.session.message = 'hello';
          ctx.body = '';
        });

        const res = await request(app.callback())
          .get('/')
          .expect('Set-Cookie', /koa\.sess/)
          .expect(200);
        cookie = res.get('Set-Cookie')!.join(';');
        assert.match(cookie, /\d+_suffix/);
      });

      it('should pass sid to middleware', async () => {
        const app = App();

        app.use(async function(ctx) {
          ctx.session.message = 'hello';
          assert.match(ctx.state.sid, /\d+_suffix/);
          ctx.body = '';
        });

        const res = await request(app.callback())
          .get('/')
          .expect('Set-Cookie', /koa\.sess/)
          .expect(200);

        cookie = res.get('Set-Cookie')!.join(';');
        assert.match(cookie, /\d+_suffix/);
      });

      it('should not Set-Cookie', async () => {
        const app = App();

        app.use(async function(ctx) {
          ctx.body = ctx.session;
        });

        const res = await request(app.callback())
          .get('/')
          .expect(200);
        assert.equal(res.get('Set-Cookie'), undefined, 'should not have set cookie');
      });
    });
  });

  describe('saved session', () => {
    describe('when not accessed', () => {
      it('should not Set-Cookie', async () => {
        const app = App();

        app.use(async function(ctx) {
          ctx.body = 'aklsdjflasdjf';
        });

        const res = await request(app.callback())
          .get('/')
          .set('Cookie', cookie)
          .expect(200);
        assert.equal(res.get('Set-Cookie'), undefined, 'should not have set cookie');
      });
    });

    describe('when accessed but not changed', () => {
      it('should be the same session', async () => {
        const app = App();

        app.use(async function(ctx) {
          assert.equal(ctx.session.message, 'hello');
          ctx.body = 'aklsdjflasdjf';
        });

        await request(app.callback())
          .get('/')
          .set('Cookie', cookie)
          .expect(200);
      });

      it('should not Set-Cookie', async () => {
        const app = App();

        app.use(async function(ctx) {
          assert.equal(ctx.session.message, 'hello');
          ctx.body = 'aklsdjflasdjf';
        });

        const res = await request(app.callback())
          .get('/')
          .set('Cookie', cookie)
          .expect(200);
        assert.equal(res.get('Set-Cookie'), undefined, 'should not have set cookie');
      });
    });

    describe('when accessed and changed', () => {
      it('should Set-Cookie', async () => {
        const app = App();

        app.use(async function(ctx) {
          ctx.session.money = '$$$';
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

        app.use(async function(ctx) {
          ctx.session = null;
          ctx.body = 'asdf';
        });

        await request(app.callback())
          .get('/')
          .expect('Set-Cookie', /koa\.sess/);
      });
    });

    describe('an empty object', () => {
      it('should not Set-Cookie', async () => {
        const app = App();

        app.use(async function(ctx) {
          ctx.session = {};
          ctx.body = 'asdf';
        });

        const res = await request(app.callback())
          .get('/')
          .expect(200);
        assert.equal(res.get('Set-Cookie'), undefined, 'should not have set cookie');
      });
    });

    describe('an object', () => {
      it('should create a session', async () => {
        const app = App();

        app.use(async function(ctx) {
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

        app.use(async function(ctx) {
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

        app.use(async function(ctx) {
          ctx.session.foo = 'bar';
          ctx.body = ctx.session[inspect]();
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

        app.use(async function(ctx) {
          ctx.session.foo = 'bar';
          ctx.body = String(ctx.session.length);
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

        app.use(async function(ctx) {
          ctx.session.foo = 'bar';
          ctx.body = String(ctx.session.populated);
        });

        await request(app.listen())
          .get('/')
          .expect('Set-Cookie', /koa\.sess=.+;/)
          .expect('true')
          .expect(200);
      });
    });

    describe('.save()', () => {
      it('should save session', async () => {
        const app = App();

        app.use(async function(ctx) {
          ctx.session.save();
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

      app.use(async function(ctx, next) {
        try {
          await next();
        } catch (err: any) {
          ctx.status = err.status;
          ctx.body = err.message;
        }
      });

      app.use(session({ ContextStore }, app));

      app.use(async function(ctx, next) {
        ctx.session.name = 'funny';
        await next();
      });

      app.use(async function(ctx) {
        ctx.throw(401);
      });

      await request(app.callback())
        .get('/')
        .expect('Set-Cookie', /koa\.sess/)
        .expect(401);
    });
  });

  describe('when autoCommit is present', () => {
    describe('and set to false', () => {
      it('should not set headers if manuallyCommit() isn\'t called', async () => {
        const app = App({ autoCommit: false });

        app.use(async function(ctx) {
          if (ctx.method === 'POST') {
            ctx.session.message = 'hi';
            ctx.body = 200;
            return;
          }
          ctx.body = ctx.session.message;
        });

        const res = await request(app.callback())
          .post('/')
          .expect(200);
        assert.equal(res.get('Set-Cookie'), undefined, 'should not have set cookie');
      });

      it('should set headers if manuallyCommit() is called', async () => {
        const app = App({ autoCommit: false });
        app.use(async function(ctx, next) {
          if (ctx.method === 'POST') {
            ctx.session.message = 'dummy';
          }
          await next();
        });
        app.use(async function(ctx) {
          ctx.body = 200;
          await ctx.session.manuallyCommit();
        });

        await request(app.callback())
          .post('/')
          .expect('Set-Cookie', /koa\.sess/)
          .expect(200);
      });
    });
  });

  describe('when maxAge present', () => {
    describe('and set to be a session cookie', () => {
      it('should not expire the session', async () => {
        const app = App({ maxAge: 'session' });

        app.use(async function(ctx) {
          if (ctx.method === 'POST') {
            ctx.session.message = 'hi';
            ctx.body = 200;
            return;
          }
          ctx.body = ctx.session.message;
        });

        const res = await request(app.callback())
          .post('/')
          .expect('Set-Cookie', /koa\.sess/)
          .expect(200);

        const cookie = res.get('Set-Cookie')!.join(';');
        assert.doesNotMatch(cookie, /expires=/);
        await request(app.callback())
          .get('/')
          .set('cookie', cookie)
          .expect('hi');
      });

      it('should not expire the session after multiple session changes', async () => {
        const app = App({ maxAge: 'session' });

        app.use(async function(ctx) {
          ctx.session.count = (ctx.session.count || 0) + 1;
          ctx.body = `hi ${ctx.session.count}`;
        });

        let res = await request(app.callback())
          .get('/')
          .expect('Set-Cookie', /koa\.sess/)
          .expect('hi 1')
          .expect(200);
        let cookie = res.get('Set-Cookie')!.join(';');
        assert.doesNotMatch(cookie, /expires=/);

        res = await request(app.callback())
          .get('/')
          .set('cookie', cookie)
          .expect('Set-Cookie', /koa\.sess/)
          .expect('hi 2')
          .expect(200);
        cookie = res.get('Set-Cookie')!.join(';');
        assert.doesNotMatch(cookie, /expires=/);

        res = await request(app.callback())
          .get('/')
          .set('cookie', cookie)
          .expect('Set-Cookie', /koa\.sess/)
          .expect('hi 3')
          .expect(200);
        cookie = res.get('Set-Cookie')!.join(';');
        assert.doesNotMatch(cookie, /expires=/);
      });

      it('should throw error when the maxAge improper string given', () => {
        assert.throws(() => {
          App({ maxAge: 'not the right string' } as any);
        }, /Invalid input/);
      });
    });

    describe('and not expire', () => {
      it('should not expire the session', async () => {
        const app = App({ maxAge: 100 });

        app.use(async function(ctx) {
          if (ctx.method === 'POST') {
            ctx.session.message = 'hi';
            ctx.body = 200;
            return;
          }
          ctx.body = ctx.session.message;
        });

        const res = await request(app.callback())
          .post('/')
          .expect('Set-Cookie', /koa\.sess/)
          .expect(200);
        const cookie = res.get('Set-Cookie')!.join(';');
        await request(app.callback())
          .get('/')
          .set('cookie', cookie)
          .expect('hi');
      });
    });

    describe('and expired', () => {
      it('should expire the sess', async () => {
        const app = App({ maxAge: 100 });

        app.use(async function(ctx) {
          if (ctx.method === 'POST') {
            ctx.session.message = 'hi';
            ctx.status = 200;
            return;
          }

          ctx.body = ctx.session.message || '';
        });

        const res = await request(app.callback())
          .post('/')
          .expect('Set-Cookie', /koa\.sess/)
          .expect(200);
        const cookie = res.get('Set-Cookie')!.join(';');
        await scheduler.wait(200);
        await request(app.callback())
          .get('/')
          .set('cookie', cookie)
          .expect('');
      });
    });
  });

  describe('ctx.session.maxAge', () => {
    it('should return opt.maxAge', async () => {
      const app = App({ maxAge: 100 });

      app.use(async function(ctx) {
        ctx.body = ctx.session.maxAge;
      });

      await request(app.callback())
        .get('/')
        .expect('100');
    });
  });

  describe('ctx.session.maxAge=', () => {
    it('should set sessionOptions.maxAge', async () => {
      const app = App();

      app.use(async function(ctx) {
        ctx.session.foo = 'bar';
        ctx.session.maxAge = 100;
        ctx.body = ctx.session.foo;
      });

      await request(app.callback())
        .get('/')
        .expect('Set-Cookie', /expires=/)
        .expect(200);
    });

    it('should save even session not change', async () => {
      const app = App();

      app.use(async function(ctx) {
        ctx.session.maxAge = 100;
        ctx.body = ctx.session;
      });

      await request(app.callback())
        .get('/')
        .expect('Set-Cookie', /expires=/)
        .expect(200);
    });

    it('should save when create session only with maxAge', async () => {
      const app = App();

      app.use(async function(ctx) {
        ctx.session = { maxAge: 100 };
        ctx.body = ctx.session;
      });

      await request(app.callback())
        .get('/')
        .expect('Set-Cookie', /expires=/)
        .expect(200);
    });
  });

  describe('when store return empty', () => {
    it('should create new Session', async () => {
      const app = App({ signed: false });

      app.use(async function(ctx) {
        ctx.body = String(ctx.session.isNew);
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
        ContextStore,
      }, app));

      app.use(async function(ctx) {
        if (!ctx.session.foo) {
          ctx.session.foo = Date.now() + '|uid:' + ctx.cookies.get('uid');
        }

        ctx.body = {
          foo: ctx.session.foo,
          uid: ctx.cookies.get('uid'),
        };
      });

      let res = await request(app.callback())
        .get('/')
        .set('Cookie', 'uid=123')
        .expect(200);

      const data = res.body;
      const cookies = res.get('Set-Cookie')!.join(';');
      assert.match(cookies, /koa\.sess=/);

      res = await request(app.callback())
        .get('/')
        .set('Cookie', cookies + ';uid=123')
        .expect(200)
        .expect(data);

      // should ignore uid:123 session and create a new session for uid:456
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

      app.use(async function(ctx) {
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
});
