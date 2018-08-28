'use strict';

const Koa = require('koa');
const request = require('supertest');
const should = require('should');
const mm = require('mm');
const session = require('..');
const ContextStore = require('./context_store');

describe('Koa Session External Context Store', () => {
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
        .expect('Set-Cookie', /koa:sess/)
        .expect(200, (err, res) => {
          if (err) return done(err);
          cookie = res.header['set-cookie'].join(';');
          cookie.indexOf('_suffix').should.greaterThan(1);
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
        .expect('Set-Cookie', /koa:sess/)
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
        .expect('Set-Cookie', /koa:sess/)
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
        .expect('Set-Cookie', /koa:sess/)
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
          ctx.body = ctx.session.inspect();
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

        app.use(async function(ctx) {
          ctx.session.foo = 'bar';
          ctx.body = String(ctx.session.length);
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

        app.use(async function(ctx) {
          ctx.session.foo = 'bar';
          ctx.body = String(ctx.session.populated);
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

        app.use(async function(ctx) {
          ctx.session.save();
          ctx.body = 'hello';
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

      app.use(session({ ContextStore }, app));

      app.use(async function(ctx, next) {
        ctx.session.name = 'funny';
        await next();
      });

      app.use(async function(ctx) {
        ctx.throw(401);
      });

      request(app.listen())
      .get('/')
      .expect('Set-Cookie', /koa:sess/)
      .expect(401, done);
    });
  });

  describe('when autoCommit is present', () => {
    describe('and set to false', () => {
      it('should not set headers if manuallyCommit() isn\'t called', done => {
        const app = App({ autoCommit: false });
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
        .end((err, res) => {
          if (err) return done(err);
          const cookie = res.headers['set-cookie'];
          should.not.exist(cookie);
        })
        .expect(200, done);
      });
    });
    describe('and set to false', () => {
      it('should set headers if manuallyCommit() is called', done => {
        const app = App({ autoCommit: false });
        app.use(async function(ctx, next) {
          if (ctx.method === 'POST') {
            ctx.session.message = 'dummy';
          }
          await next();
        });
        app.use(async function(ctx) {
          ctx.body = 200;
        });
        const server = app.listen();

        request(server)
        .post('/')
        .expect('Set-Cookie', /koa:sess/)
        .end(err => {
          if (err) return done(err);
        })
        .expect(200, done);
      });
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
        .expect('Set-Cookie', /koa:sess/)
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
      it('should not expire the session after multiple session changes', done => {
        const app = App({ maxAge: 'session' });

        app.use(async function(ctx) {
          ctx.session.count = (ctx.session.count || 0) + 1;
          ctx.body = `hi ${ctx.session.count}`;
        });
        const server = app.listen();

        request(server)
        .get('/')
        .expect('Set-Cookie', /koa:sess/)
        .expect('hi 1')
        .end((err, res) => {
          if (err) return done(err);
          let cookie = res.headers['set-cookie'].join(';');
          cookie.should.not.containEql('expires=');

          request(server)
          .get('/')
          .set('cookie', cookie)
          .expect('Set-Cookie', /koa:sess/)
          .expect('hi 2')
          .end((err, res) => {
            if (err) return done(err);
            cookie = res.headers['set-cookie'].join(';');
            cookie.should.not.containEql('expires=');

            request(server)
            .get('/')
            .set('cookie', cookie)
            .expect('Set-Cookie', /koa:sess/)
            .expect('hi 3')
            .end((err, res) => {
              if (err) return done(err);
              cookie = res.headers['set-cookie'].join(';');
              cookie.should.not.containEql('expires=');

              done();
            });
          });
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
        .expect('Set-Cookie', /koa:sess/)
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

  describe('when store return empty', () => {
    it('should create new Session', done => {
      const app = App({ signed: false });

      app.use(async function(ctx) {
        ctx.body = String(ctx.session.isNew);
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
      const app = new Koa();

      app.keys = [ 'a', 'b' ];
      app.use(session({
        valid(ctx, sess) {
          return ctx.cookies.get('uid') === sess.uid;
        },
        beforeSave(ctx, sess) {
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
});

function App(options) {
  const app = new Koa();
  app.keys = [ 'a', 'b' ];
  options = options || {};
  options.ContextStore = ContextStore;
  options.genid = () => {
    return Date.now() + '_suffix';
  };
  app.use(session(options, app));
  return app;
}
