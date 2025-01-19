import snapshot from 'snap-shot-it';
import { SessionOptions } from '../src/index.js';

describe('test/index.test.ts', () => {
  describe('SessionOptions schema', () => {
    it('should have a valid schema', () => {
      const parsed = SessionOptions.parse({});
      snapshot(parsed);
    });
  });
});
