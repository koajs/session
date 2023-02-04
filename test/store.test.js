'use strict';

const Koa = require('koa');
const request = require('supertest');
const should = require('should');
const mm = require('mm');
const session = require('..');
const store = require('./store');
const pedding = require('pedding');
const assert = require('assert');
const sleep = require('mz-modules/sleep');

const inspect = Symbol.for('nodejs.util.inspect.custom');

describe('Koa Session External Store', () => {
  let cookie;

  describe('when the session contains a ;', () => {
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
        const cookie = res.headers['set-cookie'];
        request(server)
        .get('/')
        .set('Cookie', cookie.join(';'))
        .expect(';', done);
      });
    });
  });

  describe('new session', () => {
    describe('when not accessed', () => {
      it('should not Set-Cookie', done => {
        const app = App();

        app.use(async function(ctx) {
          ctx.body = 'greetings';
        });

        request(app.listen())
        .get('/')
        .expect(200, (err, res) => {
          if (err) return done(err);
          res.header.should.not.have.property('set-cookie');
          done();
        });
      });
    });

    describe('when accessed and not populated', () => {
      it('should not Set-Cookie', done => {
        const app = App();

        app.use(async function(ctx) {
          ctx.session;
          ctx.body = 'greetings';
        });

        request(app.listen())
        .get('/')
        .expect(200, (err, res) => {
          if (err) return done(err);
          res.header.should.not.have.property('set-cookie');
          done();
        });
      });
    });

    describe('when populated', () => {
      it('should Set-Cookie', done => {
        const app = App();

        app.use(async function(ctx) {
          ctx.session.message = 'hello';
          ctx.body = '';
        });

        request(app.listen())
        .get('/')
        .expect('Set-Cookie', /koa\.sess/)
        .expect(200, (err, res) => {
          if (err) return done(err);
          cookie = res.header['set-cookie'].join(';');
          done();
        });
      });

      it('should not Set-Cookie', done => {
        const app = App();

        app.use(async function(ctx) {
          ctx.body = ctx.session;
        });

        request(app.listen())
        .get('/')
        .expect(200, (err, res) => {
          if (err) return done(err);
          res.header.should.not.have.property('set-cookie');
          done();
        });
      });
    });
  });

  describe('saved session', () => {
    describe('when not accessed', () => {
      it('should not Set-Cookie', done => {
        const app = App();

        app.use(async function(ctx) {
          ctx.body = 'aklsdjflasdjf';
        });

        request(app.listen())
        .get('/')
        .set('Cookie', cookie)
        .expect(200, (err, res) => {
          if (err) return done(err);
          res.header.should.not.have.property('set-cookie');
          done();
        });
      });
    });

    describe('when accessed but not changed', () => {
      it('should be the same session', done => {
        const app = App();

        app.use(async function(ctx) {
          ctx.session.message.should.equal('hello');
          ctx.body = 'aklsdjflasdjf';
        });

        request(app.listen())
        .get('/')
        .set('Cookie', cookie)
        .expect(200, done);
      });

      it('should not Set-Cookie', done => {
        const app = App();

        app.use(async function(ctx) {
          ctx.session.message.should.equal('hello');
          ctx.body = 'aklsdjflasdjf';
        });

        request(app.listen())
        .get('/')
        .set('Cookie', cookie)
        .expect(200, (err, res) => {
          if (err) return done(err);
          res.header.should.not.have.property('set-cookie');
          done();
        });
      });
    });

    describe('when accessed and changed', () => {
      it('should Set-Cookie', done => {
        const app = App();

        app.use(async function(ctx) {
          ctx.session.money = '$$$';
          ctx.body = 'aklsdjflasdjf';
        });

        request(app.listen())
        .get('/')
        .set('Cookie', cookie)
        .expect('Set-Cookie', /koa\.sess/)
        .expect(200, done);
      });
    });
  });

  describe('when session is', () => {
    describe('null', () => {
      it('should expire the session', done => {
        const app = App();

        app.use(async function(ctx) {
          ctx.session = null;
          ctx.body = 'asdf';
        });

        request(app.listen())
        .get('/')
        .expect('Set-Cookie', /koa\.sess/)
        .expect(200, done);
      });
    });

    describe('an empty object', () => {
      it('should not Set-Cookie', done => {
        const app = App();

        app.use(async function(ctx) {
          ctx.session = {};
          ctx.body = 'asdf';
        });

        request(app.listen())
        .get('/')
        .expect(200, (err, res) => {
          if (err) return done(err);
          res.header.should.not.have.property('set-cookie');
          done();
        });
      });
    });

    describe('an object', () => {
      it('should create a session', done => {
        const app = App();

        app.use(async function(ctx) {
          ctx.session = { message: 'hello' };
          ctx.body = 'asdf';
        });

        request(app.listen())
        .get('/')
        .expect('Set-Cookie', /koa\.sess/)
        .expect(200, done);
      });
    });

    describe('anything else', () => {
      it('should throw', done => {
        const app = App();

        app.use(async function(ctx) {
          ctx.session = 'asdf';
        });

        request(app.listen())
        .get('/')
        .expect(500, done);
      });
    });
  });

  describe('session', () => {
    describe('.inspect()', () => {
      it('should return session content', done => {
        const app = App();

        app.use(async function(ctx) {
          ctx.session.foo = 'bar';
          ctx.body = ctx.session[inspect]();
        });

        request(app.listen())
        .get('/')
        .expect('Set-Cookie', /koa\.sess=.+;/)
        .expect({ foo: 'bar' })
        .expect(200, done);
      });
    });

    describe('.length', () => {
      it('should return session length', done => {
        const app = App();

        app.use(async function(ctx) {
          ctx.session.foo = 'bar';
          ctx.body = String(ctx.session.length);
        });

        request(app.listen())
        .get('/')
        .expect('Set-Cookie', /koa\.sess=.+;/)
        .expect('1')
        .expect(200, done);
      });
    });

    describe('.populated', () => {
      it('should return session populated', done => {
        const app = App();

        app.use(async function(ctx) {
          ctx.session.foo = 'bar';
          ctx.body = String(ctx.session.populated);
        });

        request(app.listen())
        .get('/')
        .expect('Set-Cookie', /koa\.sess=.+;/)
        .expect('true')
        .expect(200, done);
      });
    });

    describe('.save()', () => {
      it('should save session', done => {
        const app = App();

        app.use(async function(ctx) {
          ctx.session.save();
          ctx.body = 'hello';
        });

        request(app.listen())
        .get('/')
        .expect('Set-Cookie', /koa\.sess=.+;/)
        .expect('hello')
        .expect(200, done);
      });
    });
  });

  describe('when an error is thrown downstream and caught upstream', () => {
    it('should still save the session', done => {
      const app = new Koa();

      app.keys = [ 'a', 'b' ];

      app.use(async function(ctx, next) {
        try {
          await next();
        } catch (err) {
          ctx.status = err.status;
          ctx.body = err.message;
        }
      });

      app.use(session({ store }, app));

      app.use(async function(ctx, next) {
        ctx.session.name = 'funny';
        await next();
      });

      app.use(async function(ctx) {
        ctx.throw(401);
      });

      request(app.listen())
      .get('/')
      .expect('Set-Cookie', /koa\.sess/)
      .expect(401, done);
    });
  });

  describe('when maxAge present', () => {
    describe('and set to be a session cookie', () => {
      it('should not expire the session', done => {
        const app = App({ maxAge: 'session' });

        app.use(async function(ctx) {
          if (ctx.method === 'POST') {
            ctx.session.message = 'hi';
            ctx.body = 200;
            return;
          }
          ctx.body = ctx.session.message;
        });
        const server = app.listen();

        request(server)
        .post('/')
        .expect('Set-Cookie', /koa\.sess/)
        .end((err, res) => {
          if (err) return done(err);
          const cookie = res.headers['set-cookie'].join(';');
          cookie.should.not.containEql('expires=');
          request(server)
          .get('/')
          .set('cookie', cookie)
          .expect('hi', done);
        });
      });
      it('should use the default maxAge when improper string given', done => {
        const app = App({ maxAge: 'not the right string' });

        app.use(async function(ctx) {
          if (ctx.method === 'POST') {
            ctx.session.message = 'hi';
            ctx.body = 200;
            return;
          }
          ctx.body = ctx.session.message;
        });
        const server = app.listen();

        request(server)
        .post('/')
        .expect('Set-Cookie', /koa\.sess/)
        .end((err, res) => {
          if (err) return done(err);
          const cookie = res.headers['set-cookie'].join(';');
          cookie.should.containEql('expires=');
          request(server)
          .get('/')
          .set('cookie', cookie)
          .expect('hi', done);
        });
      });
    });
    describe('and not expire', () => {
      it('should not expire the session', done => {
        const app = App({ maxAge: 100 });

        app.use(async function(ctx) {
          if (ctx.method === 'POST') {
            ctx.session.message = 'hi';
            ctx.body = 200;
            return;
          }
          ctx.body = ctx.session.message;
        });

        const server = app.listen();

        request(server)
        .post('/')
        .expect('Set-Cookie', /koa\.sess/)
        .end((err, res) => {
          if (err) return done(err);
          const cookie = res.headers['set-cookie'].join(';');

          request(server)
          .get('/')
          .set('cookie', cookie)
          .expect('hi', done);
        });
      });
    });

    describe('and expired', () => {
      it('should expire the sess', done => {
        done = pedding(done, 2);
        const app = App({ maxAge: 100 });
        app.on('session:expired', args => {
          assert(args.key.match(/^\w+-/));
          assert(args.value);
          assert(args.ctx);
          done();
        });
        app.use(async function(ctx) {
          if (ctx.method === 'POST') {
            ctx.session.message = 'hi';
            ctx.status = 200;
            return;
          }

          ctx.body = ctx.session.message || '';
        });

        const server = app.listen();

        request(server)
        .post('/')
        .expect('Set-Cookie', /koa\.sess/)
        .end((err, res) => {
          if (err) return done(err);
          const cookie = res.headers['set-cookie'].join(';');

          setTimeout(() => {
            request(server)
          .get('/')
          .set('cookie', cookie)
          .expect('', done);
          }, 200);
        });
      });
    });
  });

  describe('ctx.session.maxAge', () => {
    it('should return opt.maxAge', done => {
      const app = App({ maxAge: 100 });

      app.use(async function(ctx) {
        ctx.body = ctx.session.maxAge;
      });

      request(app.listen())
      .get('/')
      .expect('100', done);
    });
  });

  describe('ctx.session.maxAge=', () => {
    it('should set sessionOptions.maxAge', done => {
      const app = App();

      app.use(async function(ctx) {
        ctx.session.foo = 'bar';
        ctx.session.maxAge = 100;
        ctx.body = ctx.session.foo;
      });

      request(app.listen())
      .get('/')
      .expect('Set-Cookie', /expires=/)
      .expect(200, done);
    });

    it('should save even session not change', done => {
      const app = App();

      app.use(async function(ctx) {
        ctx.session.maxAge = 100;
        ctx.body = ctx.session;
      });

      request(app.listen())
      .get('/')
      .expect('Set-Cookie', /expires=/)
      .expect(200, done);
    });

    it('should save when create session only with maxAge', done => {
      const app = App();

      app.use(async function(ctx) {
        ctx.session = { maxAge: 100 };
        ctx.body = ctx.session;
      });

      request(app.listen())
      .get('/')
      .expect('Set-Cookie', /expires=/)
      .expect(200, done);
    });
  });

  describe('ctx.session.regenerate', () => {
    it('should change the session key, but not content', done => {
      const app = new App();
      const message = 'hi';
      app.use(async function(ctx, next) {
        ctx.session = { message: 'hi' };
        await next();
      });

      app.use(async function(ctx, next) {
        const sessionKey = ctx.cookies.get('koa.sess');
        if (sessionKey) {
          await ctx.session.regenerate();
        }
        await next();
      });

      app.use(async function(ctx) {
        ctx.session.message.should.equal(message);
        ctx.body = '';
      });
      let koaSession = null;
      request(app.callback())
      .get('/')
      .expect(200, (err, res) => {
        should.not.exist(err);
        koaSession = res.headers['set-cookie'][0];
        koaSession.should.containEql('koa.sess=');
        request(app.callback())
        .get('/')
        .set('Cookie', koaSession)
        .expect(200, (err, res) => {
          should.not.exist(err);
          const cookies = res.headers['set-cookie'][0];
          cookies.should.containEql('koa.sess=');
          cookies.should.not.equal(koaSession);
          done();
        });
      });
    });
  });

  describe('when store return empty', () => {
    it('should create new Session', done => {
      done = pedding(done, 2);
      const app = App({ signed: false });

      app.use(async function(ctx) {
        ctx.body = String(ctx.session.isNew);
      });

      app.on('session:missed', args => {
        assert(args.key === 'invalid-key');
        assert(args.ctx);
        done();
      });

      request(app.listen())
      .get('/')
      .set('cookie', 'koa.sess=invalid-key')
      .expect('true')
      .expect(200, done);
    });
  });

  describe('when valid and beforeSave set', () => {
    it('should ignore session when uid changed', done => {
      done = pedding(done, 2);
      const app = new Koa();

      app.keys = [ 'a', 'b' ];
      app.use(session({
        valid(ctx, sess) {
          return ctx.cookies.get('uid') === sess.uid;
        },
        beforeSave(ctx, sess) {
          sess.uid = ctx.cookies.get('uid');
        },
        store,
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
      app.on('session:invalid', args => {
        assert(args.key);
        assert(args.value);
        assert(args.ctx);
        done();
      });

      request(app.callback())
      .get('/')
      .set('Cookie', 'uid=123')
      .expect(200, (err, res) => {
        should.not.exist(err);
        const data = res.body;
        const cookies = res.headers['set-cookie'].join(';');
        cookies.should.containEql('koa.sess=');

        request(app.callback())
        .get('/')
        .set('Cookie', cookies + ';uid=123')
        .expect(200)
        .expect(data, err => {
          should.not.exist(err);

          // should ignore uid:123 session and create a new session for uid:456
          request(app.callback())
          .get('/')
          .set('Cookie', cookies + ';uid=456')
          .expect(200, (err, res) => {
            should.not.exist(err);
            res.body.uid.should.equal('456');
            res.body.foo.should.not.equal(data.foo);
            done();
          });
        });
      });
    });
  });

  describe('ctx.session', () => {
    after(mm.restore);

    it('can be mocked', done => {
      const app = App();

      app.use(async function(ctx) {
        ctx.body = ctx.session;
      });

      mm(app.context, 'session', {
        foo: 'bar',
      });

      request(app.listen())
      .get('/')
      .expect({
        foo: 'bar',
      })
      .expect(200, done);
    });
  });

  describe('when rolling set to true', () => {
    let app;
    before(() => {
      app = App({ rolling: true });

      app.use(async ctx => {
        if (ctx.path === '/set') ctx.session = { foo: 'bar' };
        ctx.body = ctx.session;
      });
    });

    it('should not send set-cookie when session not exists', () => {
      return request(app.callback())
      .get('/')
      .expect({})
      .expect(res => {
        should.not.exist(res.headers['set-cookie']);
      });
    });

    it('should send set-cookie when session exists and not change', done => {
      request(app.callback())
      .get('/set')
      .expect({ foo: 'bar' })
      .end((err, res) => {
        should.not.exist(err);
        res.headers['set-cookie'].should.have.length(2);
        const cookie = res.headers['set-cookie'].join(';');
        request(app.callback())
        .get('/')
        .set('cookie', cookie)
        .expect(res => {
          res.headers['set-cookie'].should.have.length(2);
        })
        .expect({ foo: 'bar' }, done);
      });
    });
  });

  describe('when prefix present', () => {
    it('should still work', done => {
      const app = App({ prefix: 'sess:' });

      app.use(async ctx => {
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
        const cookie = res.headers['set-cookie'];
        cookie.join().should.match(/koa\.sess=sess:/);
        request(server)
        .get('/')
        .set('Cookie', cookie.join(';'))
        .expect(';', done);
      });
    });
  });

  describe('when renew set to true', () => {
    let app;
    before(() => {
      app = App({ renew: true, maxAge: 2000 });

      app.use(async ctx => {
        if (ctx.path === '/set') ctx.session = { foo: 'bar' };
        ctx.body = ctx.session;
      });
    });

    it('should not send set-cookie when session not exists', () => {
      return request(app.callback())
      .get('/')
      .expect({})
      .expect(res => {
        should.not.exist(res.headers['set-cookie']);
      });
    });

    it('should send set-cookie when session near expire and not change', async () => {
      let res = await request(app.callback())
      .get('/set')
      .expect({ foo: 'bar' });

      res.headers['set-cookie'].should.have.length(2);
      const cookie = res.headers['set-cookie'].join(';');
      await sleep(1200);
      res = await request(app.callback())
      .get('/')
      .set('cookie', cookie)
      .expect({ foo: 'bar' });
      res.headers['set-cookie'].should.have.length(2);
    });

    it('should not send set-cookie when session not near expire and not change', async () => {
      let res = await request(app.callback())
      .get('/set')
      .expect({ foo: 'bar' });

      res.headers['set-cookie'].should.have.length(2);
      const cookie = res.headers['set-cookie'].join(';');
      await sleep(500);
      res = await request(app.callback())
      .get('/')
      .set('cookie', cookie)
      .expect({ foo: 'bar' });
      should.not.exist(res.headers['set-cookie']);
    });
  });

  describe('when get session before middleware', () => {
    it('should return empty session', async () => {
      const app = new Koa();
      app.keys = [ 'a', 'b' ];
      const options = {};
      options.store = store;
      app.use(async (ctx, next) => {
        // will not take effect
        ctx.session.should.be.ok();
        ctx.session.foo = '123';
        await next();
      });
      app.use(session(options, app));
      app.use(async ctx => {
        if (ctx.path === '/set') ctx.session = { foo: 'bar' };
        ctx.body = ctx.session;
      });

      let res = await request(app.callback())
        .get('/')
        .expect({});

      res = await request(app.callback())
        .get('/set')
        .expect({ foo: 'bar' });

      res.headers['set-cookie'].should.have.length(2);
      const cookie = res.headers['set-cookie'].join(';');
      await sleep(1200);
      res = await request(app.callback())
        .get('/')
        .set('cookie', cookie)
        .expect({ foo: 'bar' });
    });
  });
});

function App(options) {
  const app = new Koa();
  app.keys = [ 'a', 'b' ];
  options = options || {};
  options.store = store;
  app.use(session(options, app));
  return app;
}
