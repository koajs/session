'use strict';

// this is a stupid nonsense example just to test

const sessions = {};

class ContextStore {
  constructor(ctx) {
    this.ctx = ctx;
  }

  * get(key) {
    return sessions[key];
  }

  * set(key, value) {
    sessions[key] = value;
  }

  * destroy(key) {
    sessions[key] = undefined;
  }
}

module.exports = ContextStore;
