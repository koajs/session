
6.4.0 / 2023-02-04
==================

**features**
  * [[`4cd3bef`](http://github.com/koajs/session/commit/4cd3bef4fc1900b847d2e133e3b2599a711f1aea)] - feat: Add Session.regenerate() method (#221) (Jürg Lehni <<juerg@scratchdisk.com>>)

6.3.1 / 2023-01-03
==================

**fixes**
  * [[`e2de39e`](http://github.com/koajs/session/commit/e2de39e6acaf5eef9c8660cbd864ecccaa2b60d0)] - fix: keep crc v3 (#223) (fengmk2 <<fengmk2@gmail.com>>)

6.3.0 / 2023-01-03
==================

**features**
  * [[`878669e`](http://github.com/koajs/session/commit/878669ee2c734e3d9902d83f57e21d2113178b79)] - feat: update uuid to v8 (#218) (zhennann <<zhen.nann@icloud.com>>)

**others**
  * [[`df2d28f`](http://github.com/koajs/session/commit/df2d28ffb177272739964eb5a503f93db870aa28)] - test: run ci on GitHub Action (#222) (fengmk2 <<fengmk2@gmail.com>>)

6.2.0 / 2021-03-30
==================

**features**
  * [[`7cde341`](http://github.com/koajs/session/commit/7cde341db1691ee6885eb1b11ff3a3a3632fd5ce)] - feat: add session.externalKey (#207) (Yiyu He <<dead_horse@qq.com>>)

6.1.0 / 2020-10-08
==================

**features**
  * [[`32e3526`](http://github.com/koajs/session/commit/32e352665f2adbcda34d1d990bb6c5d875c0b625)] - feat: add context to external store .get() and .set() options params (#201) (Ngorror <<ngorror@gmail.com>>)

**others**
  * [[`f765595`](http://github.com/koajs/session/commit/f76559568bb7f6321cab3f44ae759521deca3dd1)] - chore: Create LICENSE File (#195) (Dominic Egginton <<dominic.egginton@gmail.com>>)
6.0.0 / 2020-04-26
==================

**fixes**
  * [[`d34fc8e`](https://github.com/koajs/session/commit/d34fc8e0395bd3dc0c8cceda4374039a4d414060)] - fix: RFC6265 compliant default cookie name (#197) (zacanger <<zac@zacanger.com>>)
    * [BREAKING CHANGE]: Default cookie is now `koa.sess` rather than `koa:sess`

5.13.1 / 2020-02-01
==================

**fixes**
  * [[`ecd1f5e`](http://github.com/koajs/session/commit/ecd1f5edaa6ff1e77cc461d1107432b394ce21d2)] - fix: don't set any value to sameSite by default (#194) (fengmk2 <<fengmk2@gmail.com>>)

5.13.0 / 2020-02-01
==================

**features**
  * [[`cb09a09`](http://github.com/koajs/session/commit/cb09a09cfa4767610d7cc7282a0de2a3a651c6ae)] - feat: support session cookie sameSite options (#193) (fengmk2 <<fengmk2@gmail.com>>)

5.12.3 / 2019-08-23
==================

**fixes**
  * [[`909d93f`](http://github.com/koajs/session/commit/909d93fc6b74c6e29b0e83f555f1fc4002a6a108)] - fix: correctly expire cookies for nullified sessions (Justin <<jmitchell38488@users.noreply.github.com>>)

5.12.2 / 2019-07-10
==================

**fixes**
  * [[`c23bab4`](http://github.com/koajs/session/commit/c23bab4023b95c65be46b4eeaf089608ddaa738e)] - fix: remvoe unused code (dead-horse <<dead_horse@qq.com>>)

5.12.1 / 2019-07-10
==================

**fixes**
  * [[`77968e3`](http://github.com/koajs/session/commit/77968e3ff6fb5d4f4a36665474ccd992fed689ec)] - fix: ensure ctx.session always has value (dead-horse <<dead_horse@qq.com>>)

5.12.0 / 2019-05-17
==================

**features**
  * [[`39ca830`](http://github.com/koajs/session/commit/39ca830a99ae7fcab2bd499a1f2a87de53fd1944)] - feat: add the parameter "ctx" to the function "genid" so can get the … (#173) (松松 <<1733458402@qq.com>>)

**others**
  * [[`3d57a44`](http://github.com/koajs/session/commit/3d57a443c7e0050d4066c871bf8da2656cda99f1)] - docs: add genid(ctx) in readme (dead-horse <<dead_horse@qq.com>>)

5.11.0 / 2019-04-29
==================

**features**
  * [[`b79134d`](http://github.com/koajs/session/commit/b79134d6854173bf46d6703e79636a58f9282e15)] - feat: make sure session id is global unique (#170) (fengmk2 <<fengmk2@gmail.com>>)

**fixes**
  * [[`c2b4259`](http://github.com/koajs/session/commit/c2b4259ccef6095cad2f3ff51968b21cea993d13)] - fix: remove package-lock.json (fengmk2 <<fengmk2@gmail.com>>)

**others**
  * [[`23ad871`](http://github.com/koajs/session/commit/23ad8718a9a392c0c563893a10b5ca9f6fd70ebe)] - deps: Fix security vulnerabilities from npm audit (#163) (Douglas Wade <<douglas.b.wade@gmail.com>>)
  * [[`1600aab`](http://github.com/koajs/session/commit/1600aabdfa6a86973e3fab9f4064c3ed82b10604)] - test: changed "ctx.session is mockable" tests names to more appropriate (#158) (Vitaliy Zaytsev <<teh.kroleg@gmail.com>>)

5.10.1 / 2018-12-18
==================

**features**
  * [[`5f12f70`](http://github.com/koajs/session/commit/5f12f7019b4fbb3ce1d495c1c7fb8a234ae16818)] - feat: allow init multi session middleware (#159) (killa <<killa123@126.com>>)

**fixes**
  * [[`89c048a`](http://github.com/koajs/session/commit/89c048adc5a64b6c12c87047b766ac34be10af77)] - fix: moved "pedding" package to dev dependencies (#155) (Vitaliy Zaytsev <<teh.kroleg@gmail.com>>)

5.10.0 / 2018-10-29
==================

**features**
  * [[`81906f7`](http://github.com/koajs/session/commit/81906f7724ef009dc14686f4990af35c716f6db9)] - feat: support options.externalKey #88 (#149) (Tree Xie <<vicansocanbico@gmail.com>>)

5.9.0 / 2018-08-28
==================

**features**
  * [[`7241400`](http://github.com/koajs/session/commit/724140076b65867b1a0cffee4f061971be8751c0)] - feat: Add autoCommit option (#139) (Jonas Galvez <<jonasgalvez@gmail.com>>)

5.8.3 / 2018-08-22
==================

**fixes**
  * [[`6f1a41c`](http://github.com/koajs/session/commit/6f1a41cf499f55532f0e7ce0de04d778a0466496)] - fix: session not works (#136) (吖猩 <<whxaxes@qq.com>>)

**others**
  * [[`95272ff`](http://github.com/koajs/session/commit/95272ff912af8dd31ae9f038df9540d8b6c019d7)] - fix typo in README.md (#134) (Maples7 <<maples7@163.com>>)

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
