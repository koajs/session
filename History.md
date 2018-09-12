
2.0.1 / 2018-09-12
==================

**fixes**
  * [[`bb74319`](http://github.com/koajs/session/commit/bb74319436d98798331e5c81234d9af6322cb2de)] - fix: pin debug@3 (#141) (Yiyu He <<dead_horse@qq.com>>)

**others**
  * [[`414133f`](http://github.com/koajs/session/commit/414133f60b6c0b1cf40b6bb8b0261b23276fbb98)] - 2.0.0 (Jonathan Ong <<jonathanrichardong@gmail.com>>),

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
