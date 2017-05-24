'use strict';

const koa = require('koa');
const request = require('supertest');
const should = require('should');
const mm = require('mm');
const session = require('..');
const store = require('./store');

describe('Koa Session External Store', () => {
  let cookie;

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

    describe('.save()', () => {
      it('should save session', done => {
        const app = App();

        app.use(function* () {
          this.session.save();
          this.body = 'hello';
        });

        request(app.listen())
        .get('/')
        .expect('Set-Cookie', /koa:sess=.+;/)
        .expect('hello')
        .expect(200, done);
      });
    });
  });

  describe('when an error is thrown downstream and caught upstream', () => {
    it('should still save the session', done => {
      const app = koa();

      app.keys = [ 'a', 'b' ];

      app.use(function* (next) {
        try {
          yield next;
        } catch (err) {
          this.status = err.status;
          this.body = err.message;
        }
      });

      app.use(session({ store }, app));

      app.use(function* (next) {
        this.session.name = 'funny';
        yield next;
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
    describe('and set to be a session cookie', () => {
      it('should not expire the session', done => {
        const app = App({ maxAge: 'session' });

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

    it('should save even session not change', done => {
      const app = App();

      app.use(function* () {
        this.session.maxAge = 100;
        this.body = this.session;
      });

      request(app.listen())
      .get('/')
      .expect('Set-Cookie', /expires=/)
      .expect(200, done);
    });

    it('should save when create session only with maxAge', done => {
      const app = App();

      app.use(function* () {
        this.session = { maxAge: 100 };
        this.body = this.session;
      });

      request(app.listen())
      .get('/')
      .expect('Set-Cookie', /expires=/)
      .expect(200, done);
    });
  });

  describe('when store return empty', () => {
    it('should create new Session', done => {
      const app = App({ signed: false });

      app.use(function* () {
        this.body = String(this.session.isNew);
      });

      request(app.listen())
      .get('/')
      .set('cookie', 'koa:sess=invalid-key')
      .expect('true')
      .expect(200, done);
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
        store,
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

  describe('ctx.session', () => {
    after(mm.restore);

    it('should be mocked', done => {
      const app = App();

      app.use(function* () {
        this.body = this.session;
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

});

function App(options) {
  const app = koa();
  app.keys = [ 'a', 'b' ];
  options = options || {};
  options.store = store;
  app.use(session(options, app));
  return app;
}
