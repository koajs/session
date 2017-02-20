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

  constructor(ctx, obj) {
    this._ctx = ctx;
    if (!obj) {
      this.isNew = true;
    }
    else {
      for (var k in obj) {
        // change session options
        if ('_maxAge' == k) this._ctx.sessionOptions.maxAge = obj._maxAge;
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
    var obj = {};

    Object.keys(this).forEach(key => {
      if ('isNew' == key) return;
      if ('_' == key[0]) return;
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
    return this._ctx.sessionOptions.maxAge;
  }

  /**
   * set session maxAge
   *
   * @param {Number}
   * @api public
   */

  set maxAge(val) {
    this._ctx.sessionOptions.maxAge = val;
  }
};

module.exports = Session;
