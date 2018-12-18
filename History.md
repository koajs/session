
4.8.1 / 2018-12-18
==================

**features**
  * [[`d792770`](http://github.com/koajs/session/commit/d7927708848a0e39a0652643ed3b6426ceb4952c)] - feat: allow init multi session middleware (#160) (killa <<killa123@126.com>>)

4.8.0 / 2018-01-17
==================

**features**
  * [[`ca6b329`](http://github.com/koajs/session/commit/ca6b32906678b3cf6168c4afac250b2e68fd17c8)] - feat: support opts.renew (#111) (Yiyu He <<dead_horse@qq.com>>)

**fixes**
  * [[`5c2fc72`](http://github.com/koajs/session/commit/5c2fc72cab47450da2c9ae8fedba8657d0c264ee)] - fix: ensure store expired after cookie (dead-horse <<dead_horse@qq.com>>)

4.7.1 / 2018-01-11
==================

**fixes**
  * [[`5683102`](http://github.com/koajs/session/commit/5683102687c48ba11521d8b249126de13e7c0d8b)] - fix: emit event in next tick (dead-horse <<dead_horse@qq.com>>)

4.7.0 / 2018-01-09
==================

**features**
  * [[`f8b1822`](http://github.com/koajs/session/commit/f8b18228c90a6a0d7b8d91c560b9675bafd5a552)] - feat: emit event expose ctx (dead-horse <<dead_horse@qq.com>>)

4.6.0 / 2018-01-09
==================

**features**
  * [[`c8298a3`](http://github.com/koajs/session/commit/c8298a3f60aabc3067f0a2db0409df05f1ed71a1)] - feat: emit events when session invalid (#109) (Yiyu He <<dead_horse@qq.com>>)

4.5.0 / 2017-08-04
==================

**features**
  * [[`b537dea`](http://github.com/koajs/session/commit/b537deaeb2db352bdcab3be2c8b7578760fc69da)] - feat: support options.prefix for external store (#92) (Yiyu He <<dead_horse@qq.com>>)

4.4.0 / 2017-07-03
==================

  * feat: opts.genid (#86)

4.3.0 / 2017-06-17
==================

  * feat: support rolling (#82)

4.2.0 / 2017-06-15
==================

  * feat: support options.ContextStore (#80)

4.1.0 / 2017-06-01
==================

  * Create capability to create cookies that expire when browser is close… (#77)

4.0.1 / 2017-03-01
==================

  * fix: ctx.session should be configurable (#67)

4.0.0 / 2017-02-27
==================

  * [BREAKING CHANGE]: Drop support for node < 4.
  * [BREAKING CHANGE]: Internal implementations are changed, so some private API is changed.
    * Change private api `session.save()`, won't set cookie immediately now.
    * Remove private api `session.changed()`.
    * Remove undocumented property context.sessionKey, can use opts.key instead.
    * Change undocumented property context.sessionOptions to getter.
  * feat: Support external store by pass options.store.
  * feat: Throw when encode session error, consider a breaking change.
  * feat: Clean cookie when decode session throw error, ensure next request won't throw again.
  * fix: Customize options.decode will check expired now
  * docs: Remove Semantics in README because it's not "guest" sessions any more

3.4.0 / 2016-10-15
==================

  * fix: add 'session' name for middleware function (#58)
  * chore(package): update dependencies
  * readme: ignore favicon in example

3.3.1 / 2015-07-08
==================

  * code: fix error in variable referencing

3.3.0 / 2015-07-07
==================

  * custom encode/decode support

3.2.0 / 2015-06-08
==================

  * feat: add opts.valid() and opts.beforeSave() hooks

3.1.1 / 2015-06-04
==================

  * deps: upgrade deep-equal to 1.0.0
  * fix: allow get session property before enter session middleware

3.1.0 / 2014-12-25
==================

  * add session.maxAge
  * set expire in cookie value

3.0.0 / 2014-12-11
==================

  * improve performance by reduce hiddin class on every request
  * refactor with commit() helper
  * refactor error handling with finally statement

2.0.0 / 2014-02-17
==================

 * changed cookies to be base64-encoded (somewhat breaks backwards compatibility)

1.2.1 / 2014-02-04
==================

 * fix saving sessions when a downstream error is thrown

1.2.0 / 2013-12-21
==================

 * remove sid from docs
 * remove uid2 dep
 * change: only save new sessions if populated
 * update to use new middleware signature

1.1.0 / 2013-11-15
==================

 * add change check, removing the need for `.save()`
 * add sane defaults. Closes #4
 * add session clearing support. Closes #9
 * remove public `.save()`
