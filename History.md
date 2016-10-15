
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
