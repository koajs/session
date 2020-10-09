'use strict';

/**
 * Session model.
 */

class Session {
  /**
   * Session constructor
   * @param {Context} ctx
   * @param {Object} obj
   * @api private
   */

  constructor(sessionContext, obj) {
    this.__sessCtx = sessionContext;
    this.__ctx = sessionContext.ctx;
    if (!obj) {
      this.isNew = true;
    } else {
      for (const k in obj) {
        // restore maxAge from store
        if (k === '__maxAge') this.__ctx.sessionOptions.maxAge = obj.__maxAge;
        else if (k === '__session') this.__ctx.sessionOptions.maxAge = 'session';
        else this[k] = obj[k];
      }
    }
  }

  /**
   * JSON representation of the session.
   *
   * @return {Object}
   * @api public
   */

  toJSON() {
    const obj = {};

    Object.keys(this).forEach(key => {
      if (key === 'isNew') return;
      if (key.startsWith('__')) return;
      obj[key] = this[key];
    });

    return obj;
  }

  /**
   *
   * alias to `toJSON`
   * @api public
   */

  inspect() {
    return this.toJSON();
  }

  /**
   * Return how many values there are in the session object.
   * Used to see if it's "populated".
   *
   * @return {Number}
   * @api public
   */

  get length() {
    return Object.keys(this.toJSON()).length;
  }

  /**
   * populated flag, which is just a boolean alias of .length.
   *
   * @return {Boolean}
   * @api public
   */

  get populated() {
    return !!this.length;
  }

  /**
   * get session maxAge
   *
   * @return {Number}
   * @api public
   */

  get maxAge() {
    return this.__ctx.sessionOptions.maxAge;
  }

  /**
   * set session maxAge
   *
   * @param {Number}
   * @api public
   */

  set maxAge(val) {
    this.__ctx.sessionOptions.maxAge = val;
    // maxAge changed, must save to cookie and store
    this.__requireSave = true;
  }

  /**
   * save this session no matter whether it is populated
   *
   * @api public
   */

  save() {
    this.__requireSave = true;
  }

  /**
   * commit this session's headers if autoCommit is set to false
   *
   * @api public
   */

  async manuallyCommit() {
    await this.__sessCtx.commit();
  }

}

module.exports = Session;
