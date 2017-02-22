'use strict';

const sessions = {};

module.exports = {
  * get(key) {
    return sessions[key];
  },

  * set(key, value) {
    sessions[key] = value;
  },

  * destroy(key) {
    sessions[key] = undefined;
  },
};
