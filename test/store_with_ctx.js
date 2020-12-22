'use strict';

const sessions = {};

module.exports = {
  async get(key, maxAge, options) {
    // check access to options.ctx
    options.ctx.state.test = 'get';
    return sessions[key];
  },

  async set(key, sess, maxAge, options) {
    // check access to options.ctx
    options.ctx.state.test = 'set';
    sessions[key] = sess;
  },

  async destroy(key, options) {
    // check access to options.ctx
    options.ctx.state.test = 'destroyed';
    sessions[key] = undefined;
  },
};
