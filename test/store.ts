const sessions: Record<string, unknown> = {};

export default {
  async get(key: string) {
    return sessions[key];
  },

  async set(key: string, value: unknown) {
    sessions[key] = value;
  },

  async destroy(key: string) {
    sessions[key] = undefined;
  },
};
