const sessions: Record<string, unknown> = {};

export default {
  async get(key: string, _maxAge: number, options: any) {
    // check access to options.ctx
    options.ctx.state.test = 'get';
    return sessions[key];
  },

  async set(key: string, sess: Record<string, unknown>, _maxAge: number, options: any) {
    // check access to options.ctx
    options.ctx.state.test = 'set';
    sessions[key] = sess;
  },

  async destroy(key: string, options: any) {
    // check access to options.ctx
    options.ctx.state.test = 'destroyed';
    sessions[key] = undefined;
  },
};
