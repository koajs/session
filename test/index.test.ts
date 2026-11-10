import { strict as assert } from 'node:assert';
import snapshot from 'snap-shot-it';
import { SessionOptions } from '../src/index.js';

describe('test/index.test.ts', () => {
  describe('SessionOptions schema', () => {
    it('should have a valid schema', () => {
      const parsed = SessionOptions.parse({});
      snapshot(parsed);
    });
    it('should accept Zod 4 function schemas with the existing Koa 2 middleware API', () => {
      const opts = SessionOptions.safeParse({
        externalKey: {
          get: (ctx: unknown) => String(ctx),
          set: (ctx: unknown, key: string) => { assert.notEqual(ctx, key); },
        },
        genid: (ctx: unknown) => String(ctx),
      });
      assert.equal(opts.success, true);
    });
    it('should still reject non-function callback options', () => {
      const opts = SessionOptions.safeParse({
        externalKey: { get: 'invalid', set: null },
      });
      assert.equal(opts.success, false);
    });
  });
});
