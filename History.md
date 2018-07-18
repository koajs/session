
5.8.2 / 2018-07-12
==================

**fixes**
  * [[`c487944`](http://github.com/koajs/session/commit/c487944c22056fdd37433bdeab3d665dbd116744)] - fix: Fixes a bug that reset the cookie expire date to the default (1 day) when using browser sessions (maxAge: 'session') (#117) (Adriano <<adrianocola@gmail.com>>)

**others**
  * [[`9050605`](http://github.com/koajs/session/commit/90506055366a31205b0895592eb00d43f8d9da28)] - deps: Upgrade debug@^3.1.0 (#107) (Daniel Tseng <<s92f002@hotmail.com>>)
  * [[`c48e1e0`](http://github.com/koajs/session/commit/c48e1e054566fe09c81ff50f530c6f230f07c7d5)] - Update Readme.md (#123) (Wellington Soares <<well.cco@gmail.com>>)

5.8.1 / 2018-01-17
==================

**fixes**
  * [[`bdb4fd4`](http://github.com/koajs/session/commit/bdb4fd45a7c247c94f0035585104b004e36ec725)] - fix: ensure store expired after cookie (dead-horse <<dead_horse@qq.com>>)

5.8.0 / 2018-01-17
==================

**features**
  * [[`bb5f4bf`](http://github.com/koajs/session/commit/bb5f4bf86da802cb37cd5e3a990b5bbcc4f6d144)] - feat: support opts.renew (#111) (Yiyu He <<dead_horse@qq.com>>)

5.7.1 / 2018-01-11
==================

**fixes**
  * [[`72fa5fe`](http://github.com/koajs/session/commit/72fa5fec71a8fa3c4e8b75226b401e965d8d31c7)] - fix: emit event in next tick (dead-horse <<dead_horse@qq.com>>)

5.7.0 / 2018-01-09
==================

**features**
  * [[`a2401c8`](http://github.com/koajs/session/commit/a2401c85b486a87a4bf933e457b09088496735d7)] - feat: emit event expose ctx (dead-horse <<dead_horse@qq.com>>)

5.6.0 / 2018-01-09
==================

**features**
  * [[`f00c1ef`](http://github.com/koajs/session/commit/f00c1ef9857fec52e1aaf981ba9a8e837b3e7ffa)] - feat: emit events when session invalid (#108) (Yiyu He <<dead_horse@qq.com>>)

5.5.1 / 2017-11-17
==================

**others**
  * [[`b976b10`](http://github.com/koajs/session/commit/b976b10212f522b675711badb7ce1bc9a909d19d)] - perf: no need to assign opts (#103) (Yiyu He <<dead_horse@qq.com>>)
  * [[`c040b59`](http://github.com/koajs/session/commit/c040b5997d35267a3a65becf91e327615ff17fa5)] - chore: fix example bug and use syntactic sugar (#97) (Runrioter Wung <<runrioter@gmail.com>>)
  * [[`906277a`](http://github.com/koajs/session/commit/906277a3c9995ed4f07d2cee55e3020af0c75168)] - docs: copyediting (#85) (Nate Silva <<natesilva@users.noreply.github.com>>)

5.5.0 / 2017-08-04
==================

**features**
  * [[`ec88cfb`](http://github.com/koajs/session/commit/ec88cfb095ddbfa9a0db465e3f9e459fb6f92bec)] - feat: support options.prefix for external store (#93) (Yiyu He <<dead_horse@qq.com>>)

5.4.0 / 2017-07-03
==================

  * feat: opts.genid (#87)

5.3.0 / 2017-06-17
==================

  * feat: support rolling (#84)

5.2.0 / 2017-06-15
==================

  * feat: support options.ContextStore (#81)

5.1.0 / 2017-06-01
==================

  * Create capability to create cookies that expire when browser is close… (#77)

5.0.0 / 2017-03-12
==================

  * feat: async/await support (#70)

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
