'use strict';

// this is a stupid nonsense example just to test

const sessions = {};

class ContextStore {
  constructor(ctx) {
    this.ctx = ctx;
  }

  async get(key) {
    return sessions[key];
  }

  async set(key, value) {
    sessions[key] = value;
  }

  async destroy(key) {
    sessions[key] = undefined;
  }
}

module.exports = ContextStore;
