// this is a stupid nonsense example just to test

const sessions: Record<string, unknown> = {};

export default class ContextStore {
  ctx: any;
  constructor(ctx: any) {
    this.ctx = ctx;
  }

  async get(key: string) {
    return sessions[key];
  }

  async set(key: string, value: unknown) {
    sessions[key] = value;
  }

  async destroy(key: string) {
    sessions[key] = undefined;
  }
}
