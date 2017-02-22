'use strict';

const koa = require('koa');
const request = require('supertest');
const should = require('should');
const session = require('..');

describe('Koa Session Cookie', () => {
  let cookie;

  describe('when options.signed = true', () => {
    describe('when app.keys are set', () => {
      it('should work', done => {
        const app = koa();

        app.keys = [ 'a', 'b' ];
        app.use(session({}, app));

        app.use(function* () {
          this.session.message = 'hi';
          this.body = this.session;
        });

        request(app.listen())
        .get('/')
        .expect(200, done);
      });
    });

    describe('when app.keys are not set', () => {
      it('should throw and clean this cookie', done => {
        const app = koa();

        app.use(session(app));

        app.use(function* () {
          this.session.message = 'hi';
          this.body = this.session;
        });

        request(app.listen())
        .get('/')
        .expect(500, done);
      });
    });

    describe('when app not set', () => {
      it('should throw', () => {
        const app = koa();
        (function() {
          app.use(session());
        }).should.throw('app instance required: `session(opts, app)`');
      });
    });
  });

  describe('when options.signed = false', () => {
    describe('when app.keys are not set', () => {
      it('should work', done => {
        const app = koa();

        app.use(session({ signed: false }, app));

        app.use(function* () {
          this.session.message = 'hi';
          this.body = this.session;
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

      app.use(function* () {
        if (this.method === 'POST') {
          this.session.string = ';';
          this.status = 204;
        } else {
          this.body = this.session.string;
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

        app.use(function* () {
          this.body = 'greetings';
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

        app.use(function* () {
          this.session;
          this.body = 'greetings';
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

        app.use(function* () {
          this.session.message = 'hello';
          this.body = '';
        });

        request(app.listen())
        .get('/')
        .expect('Set-Cookie', /koa:sess/)
        .expect(200, (err, res) => {
          if (err) return done(err);
          cookie = res.header['set-cookie'].join(';');
          done();
        });
      });

      it('should not Set-Cookie', done => {
        const app = App();

        app.use(function* () {
          this.body = this.session;
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

        app.use(function* () {
          this.body = 'aklsdjflasdjf';
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

        app.use(function* () {
          this.session.message.should.equal('hello');
          this.body = 'aklsdjflasdjf';
        });

        request(app.listen())
        .get('/')
        .set('Cookie', cookie)
        .expect(200, done);
      });

      it('should not Set-Cookie', done => {
        const app = App();

        app.use(function* () {
          this.session.message.should.equal('hello');
          this.body = 'aklsdjflasdjf';
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

        app.use(function* () {
          this.session.money = '$$$';
          this.body = 'aklsdjflasdjf';
        });

        request(app.listen())
        .get('/')
        .set('Cookie', cookie)
        .expect('Set-Cookie', /koa:sess/)
        .expect(200, done);
      });
    });
  });

  describe('when get session after set to null', () => {
    it('should return null', done => {
      const app = App();

      app.use(function* () {
        this.session.hello = {};
        this.session = null;
        this.body = String(this.session === null);
      });

      request(app.listen())
      .get('/')
      .expect('Set-Cookie', /koa:sess=;/)
      .expect('true')
      .expect(200, done);
    });
  });

  describe('when decode session', () => {
    describe('SyntaxError', () => {
      it('should create new session', done => {
        const app = App({ signed: false });

        app.use(function* () {
          this.body = String(this.session.isNew);
        });

        request(app.listen())
        .get('/')
        .set('cookie', 'koa:sess=invalid-session;')
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

        app.use(function* () {
          this.body = String(this.session.isNew);
        });

        request(app.listen())
        .get('/')
        .set('cookie', 'koa:sess=invalid-session;')
        .expect('Set-Cookie', /koa:sess=;/)
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

      app.use(function* () {
        this.session.foo = 'bar';
        this.body = 'hello';
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

        app.use(function* () {
          this.session.foo = 'bar';
          this.body = this.session.inspect();
        });

        request(app.listen())
        .get('/')
        .expect('Set-Cookie', /koa:sess=.+;/)
        .expect({ foo: 'bar' })
        .expect(200, done);
      });
    });

    describe('.length', () => {
      it('should return session length', done => {
        const app = App();

        app.use(function* () {
          this.session.foo = 'bar';
          this.body = String(this.session.length);
        });

        request(app.listen())
        .get('/')
        .expect('Set-Cookie', /koa:sess=.+;/)
        .expect('1')
        .expect(200, done);
      });
    });

    describe('.populated', () => {
      it('should return session populated', done => {
        const app = App();

        app.use(function* () {
          this.session.foo = 'bar';
          this.body = String(this.session.populated);
        });

        request(app.listen())
        .get('/')
        .expect('Set-Cookie', /koa:sess=.+;/)
        .expect('true')
        .expect(200, done);
      });
    });
  });

  describe('when session is', () => {
    describe('null', () => {
      it('should expire the session', done => {
        const app = App();

        app.use(function* () {
          this.session = null;
          this.body = 'asdf';
        });

        request(app.listen())
        .get('/')
        .expect('Set-Cookie', /koa:sess/)
        .expect(200, done);
      });
    });

    describe('an empty object', () => {
      it('should not Set-Cookie', done => {
        const app = App();

        app.use(function* () {
          this.session = {};
          this.body = 'asdf';
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

        app.use(function* () {
          this.session = { message: 'hello' };
          this.body = 'asdf';
        });

        request(app.listen())
        .get('/')
        .expect('Set-Cookie', /koa:sess/)
        .expect(200, done);
      });
    });

    describe('anything else', () => {
      it('should throw', done => {
        const app = App();

        app.use(function* () {
          this.session = 'asdf';
        });

        request(app.listen())
        .get('/')
        .expect(500, done);
      });
    });
  });

  describe('when an error is thrown downstream and caught upstream', () => {
    it('should still save the session', done => {
      const app = koa();

      app.keys = [ 'a', 'b' ];

      app.use(function* (next) {
        try {
          yield* next;
        } catch (err) {
          this.status = err.status;
          this.body = err.message;
        }
      });

      app.use(session(app));

      app.use(function* (next) {
        this.session.name = 'funny';
        yield* next;
      });

      app.use(function* () {
        this.throw(401);
      });

      request(app.listen())
      .get('/')
      .expect('Set-Cookie', /koa:sess/)
      .expect(401, done);
    });
  });

  describe('when maxAge present', () => {
    describe('and not expire', () => {
      it('should not expire the session', done => {
        const app = App({ maxAge: 100 });

        app.use(function* () {
          if (this.method === 'POST') {
            this.session.message = 'hi';
            this.body = 200;
            return;
          }
          this.body = this.session.message;
        });

        const server = app.listen();

        request(server)
        .post('/')
        .expect('Set-Cookie', /koa:sess/)
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

        app.use(function* () {
          if (this.method === 'POST') {
            this.session.message = 'hi';
            this.status = 200;
            return;
          }

          this.body = this.session.message || '';
        });

        const server = app.listen();

        request(server)
        .post('/')
        .expect('Set-Cookie', /koa:sess/)
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

      app.use(function* () {
        this.body = this.session.maxAge;
      });

      request(app.listen())
      .get('/')
      .expect('100', done);
    });
  });

  describe('ctx.session.maxAge=', () => {
    it('should set sessionOptions.maxAge', done => {
      const app = App();

      app.use(function* () {
        this.session.foo = 'bar';
        this.session.maxAge = 100;
        this.body = this.session.foo;
      });

      request(app.listen())
      .get('/')
      .expect('Set-Cookie', /expires=/)
      .expect(200, done);
    });
  });

  describe('when get session before enter session middleware', () => {
    it('should work', done => {
      const app = koa();

      app.keys = [ 'a', 'b' ];
      app.use(function* (next) {
        this.session.foo = 'hi';
        yield next;
      });
      app.use(session({}, app));
      app.use(function* () {
        this.body = this.session;
      });

      request(app.callback())
      .get('/')
      .expect(200, (err, res) => {
        should.not.exist(err);
        const cookies = res.headers['set-cookie'].join(';');
        cookies.should.containEql('koa:sess=');

        request(app.callback())
        .get('/')
        .set('Cookie', cookies)
        .expect(200, done);
      });
    });
  });

  describe('when valid and beforeSave set', () => {
    it('should ignore session when uid changed', done => {
      const app = koa();

      app.keys = [ 'a', 'b' ];
      app.use(session({
        valid(ctx, sess) {
          return ctx.cookies.get('uid') === sess.uid;
        },
        beforeSave(ctx, sess) {
          sess.uid = ctx.cookies.get('uid');
        },
      }, app));
      app.use(function* () {
        if (!this.session.foo) {
          this.session.foo = Date.now() + '|uid:' + this.cookies.get('uid');
        }

        this.body = {
          foo: this.session.foo,
          uid: this.cookies.get('uid'),
        };
      });

      request(app.callback())
      .get('/')
      .set('Cookie', 'uid=123')
      .expect(200, (err, res) => {
        should.not.exist(err);
        const data = res.body;
        const cookies = res.headers['set-cookie'].join(';');
        cookies.should.containEql('koa:sess=');

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

        const app = koa();
        app.keys = [ 'a', 'b' ];
        app.use(session({
          encode,
          decode,
        }, app));

        app.use(function* () {
          this.session.counter = (this.session.counter || 0) + 1;
          this.body = this.session;
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
});

function App(options) {
  const app = koa();
  app.keys = [ 'a', 'b' ];
  app.use(session(options, app));
  return app;
}
