'use strict';

const assert = require('assert');
const Koa = require('koa');
const request = require('supertest');
const should = require('should');
const session = require('..');

describe('Koa Session Cookie', () => {
  let cookie;

  describe('when options.signed = true', () => {
    describe('when app.keys are set', () => {
      it('should work', done => {
        const app = new Koa();

        app.keys = [ 'a', 'b' ];
        app.use(session({}, app));

        app.use(async function(ctx) {
          ctx.session.message = 'hi';
          ctx.body = ctx.session;
        });

        request(app.listen())
        .get('/')
        .expect(200, done);
      });
    });

    describe('when app.keys are not set', () => {
      it('should throw and clean this cookie', done => {
        const app = new Koa();

        app.use(session(app));

        app.use(async function(ctx) {
          ctx.session.message = 'hi';
          ctx.body = ctx.session;
        });

        request(app.listen())
        .get('/')
        .expect(500, done);
      });
    });

    describe('when app not set', () => {
      it('should throw', () => {
        const app = new Koa();
        (function() {
          app.use(session());
        }).should.throw('app instance required: `session(opts, app)`');
      });
    });
  });

  describe('when options.signed = false', () => {
    describe('when app.keys are not set', () => {
      it('should work', done => {
        const app = new Koa();

        app.use(session({ signed: false }, app));

        app.use(async function(ctx) {
          ctx.session.message = 'hi';
          ctx.body = ctx.session;
        });

        request(app.listen())
        .get('/')
        .expect(200, done);
      });
    });
  });

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
        // samesite is not set
        assert(!cookie.join(';').includes('samesite'));
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
        .expect(res => {
          const cookie = res.headers['set-cookie'];
          // samesite is not set
          assert(!cookie.join(';').includes('samesite'));
        })
        .expect(200, done);
      });
    });
  });

  describe('after session set to null with signed cookie', () => {
    it('should return expired cookies', done => {
      const app = App({
        signed: true,
      });

      app.use(async function(ctx) {
        ctx.session.hello = {};
        ctx.session = null;
        ctx.body = String(ctx.session === null);
      });

      request(app.listen())
        .get('/')
        .expect('Set-Cookie', /koa\.sess=; path=\/; expires=Thu, 01 Jan 1970 00:00:00 GMT/)
        .expect('Set-Cookie', /koa\.sess.sig=(.*); path=\/; expires=Thu, 01 Jan 1970 00:00:00 GMT/)
        .expect('true')
        .expect(200, done);
    });
  });

  describe('after session set to null without signed cookie', () => {
    it('should return expired cookies', done => {
      const app = App({
        signed: false,
      });

      app.use(async function(ctx) {
        ctx.session.hello = {};
        ctx.session = null;
        ctx.body = String(ctx.session === null);
      });

      request(app.listen())
        .get('/')
        .expect('Set-Cookie', /koa\.sess=; path=\/; expires=Thu, 01 Jan 1970 00:00:00 GMT/)
        .expect('true')
        .expect(200, done);
    });
  });

  describe('when get session after set to null', () => {
    it('should return null', done => {
      const app = App();

      app.use(async function(ctx) {
        ctx.session.hello = {};
        ctx.session = null;
        ctx.body = String(ctx.session === null);
      });

      request(app.listen())
      .get('/')
      .expect('Set-Cookie', /koa\.sess=;/)
      .expect('true')
      .expect(200, done);
    });
  });

  describe('when decode session', () => {
    describe('SyntaxError', () => {
      it('should create new session', done => {
        const app = App({ signed: false });

        app.use(async function(ctx) {
          ctx.body = String(ctx.session.isNew);
        });

        request(app.listen())
        .get('/')
        .set('cookie', 'koa.sess=invalid-session;')
        .expect('true')
        .expect(200, done);
      });
    });

    describe('Other Error', () => {
      it('should throw', done => {
        const app = App({
          signed: false,
          decode() {
            throw new Error('decode error');
          },
        });

        app.use(async function(ctx) {
          ctx.body = String(ctx.session.isNew);
        });

        request(app.listen())
        .get('/')
        .set('cookie', 'koa.sess=invalid-session;')
        .expect('Set-Cookie', /koa\.sess=;/)
        .expect(500, done);
      });
    });
  });

  describe('when encode session error', () => {
    it('should throw', done => {
      const app = App({
        encode() {
          throw new Error('encode error');
        },
      });

      app.use(async function(ctx) {
        ctx.session.foo = 'bar';
        ctx.body = 'hello';
      });

      app.once('error', (err, ctx) => {
        err.message.should.equal('encode error');
        should.exists(ctx);
      });

      request(app.listen())
      .get('/')
      .expect(500, done);
    });
  });

  describe('session', () => {
    describe('.inspect()', () => {
      it('should return session content', done => {
        const app = App();

        app.use(async function(ctx) {
          ctx.session.foo = 'bar';
          ctx.body = ctx.session.inspect();
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

      app.use(session(app));

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
        const app = App({ maxAge: 100 });

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

  describe('when get session before enter session middleware', () => {
    it('should work', done => {
      const app = new Koa();

      app.keys = [ 'a', 'b' ];
      app.use(async function(ctx, next) {
        ctx.session.foo = 'hi';
        await next();
      });
      app.use(session({}, app));
      app.use(async function(ctx) {
        ctx.body = ctx.session;
      });

      request(app.callback())
      .get('/')
      .expect(200, (err, res) => {
        should.not.exist(err);
        const cookies = res.headers['set-cookie'].join(';');
        cookies.should.containEql('koa.sess=');

        request(app.callback())
        .get('/')
        .set('Cookie', cookies)
        .expect(200, done);
      });
    });
  });

  describe('options.sameSite', () => {
    it('should return opt.sameSite=none', done => {
      const app = App({ sameSite: 'none' });

      app.use(async function(ctx) {
        ctx.session = { foo: 'bar' };
        ctx.body = ctx.session.foo;
      });

      request(app.listen())
      .get('/')
      .expect(res => {
        const cookies = res.headers['set-cookie'];
        cookies.length.should.equal(2);
        for (const cookie of cookies) {
          assert(cookie.includes('samesite=none; httponly'));
          assert(cookie.includes('path=/;'));
        }
      })
      .expect('bar')
      .expect(200, done);
    });

    it('should return opt.sameSite=lax', done => {
      const app = App({ sameSite: 'lax' });

      app.use(async function(ctx) {
        ctx.session = { foo: 'bar' };
        ctx.body = ctx.session.foo;
      });

      request(app.listen())
      .get('/')
      .expect(res => {
        const cookies = res.headers['set-cookie'];
        cookies.length.should.equal(2);
        for (const cookie of cookies) {
          assert(cookie.includes('samesite=lax; httponly'));
          assert(cookie.includes('path=/;'));
        }
      })
      .expect('bar')
      .expect(200, done);
    });
  });

  describe('when valid and beforeSave set', () => {
    it('should ignore session when uid changed', done => {
      const app = new Koa();

      app.keys = [ 'a', 'b' ];
      app.use(session({
        valid(ctx, sess) {
          return ctx.cookies.get('uid') === sess.uid;
        },
        beforeSave(ctx, sess) {
          sess.uid = ctx.cookies.get('uid');
        },
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

  describe('when options.encode and options.decode are functions', () => {
    describe('they are used to encode/decode stored cookie values', () => {
      it('should work', done => {
        let encodeCallCount = 0;
        let decodeCallCount = 0;

        function encode(data) {
          ++encodeCallCount;
          return JSON.stringify({ enveloped: data });
        }
        function decode(data) {
          ++decodeCallCount;
          return JSON.parse(data).enveloped;
        }

        const app = new Koa();
        app.keys = [ 'a', 'b' ];
        app.use(session({
          encode,
          decode,
        }, app));

        app.use(async function(ctx) {
          ctx.session.counter = (ctx.session.counter || 0) + 1;
          ctx.body = ctx.session;
          return;
        });

        request(app.callback())
          .get('/')
          .expect(() => { encodeCallCount.should.above(0, 'encode was not called'); })
          .expect(200, (err, res) => {
            should.not.exist(err);
            res.body.counter.should.equal(1, 'expected body to be equal to session.counter');
            const cookies = res.headers['set-cookie'].join(';');
            request(app.callback())
              .get('/')
              .set('Cookie', cookies)
              .expect(() => { decodeCallCount.should.be.above(0, 'decode was not called'); })
              .expect(200, (err, res) => {
                should.not.exist(err);
                res.body.counter.should.equal(2);
                done();
              });
          });
      });
    });
  });

  describe('when rolling set to true', () => {
    let app;
    before(() => {
      app = App({ rolling: true });

      app.use(function* () {
        console.log(this.path);
        if (this.path === '/set') this.session = { foo: 'bar' };
        this.body = this.session;
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

function App(options) {
  const app = new Koa();
  app.keys = [ 'a', 'b' ];
  app.use(session(options, app));
  return app;
}
