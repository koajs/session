'use strict';

const session = {};

module.exports = {
  * get(key) {
    return session[key];
  },

  * set(key, value) {
    session[key] = value;
  },

  * remove(key) {
    session[key] = undefined;
  },
};
