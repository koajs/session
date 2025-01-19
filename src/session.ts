import { inspect } from 'node:util';
import type { ContextSession } from './context.js';

type Callback = (err?: Error) => void;

/**
 * Session model
 */
export class Session {
  #sessCtx: ContextSession;
  #ctx: any;
  #externalKey?: string;
  isNew = false;
  _requireSave = false;
  // session expire time, will be set from sessionData
  _expire?: number;

  constructor(sessionContext: ContextSession, sessionData?: Record<string, unknown>, externalKey?: string) {
    this.#sessCtx = sessionContext;
    this.#ctx = sessionContext.ctx;
    this.#externalKey = externalKey;
    if (!sessionData) {
      this.isNew = true;
    } else {
      for (const k in sessionData) {
        // restore maxAge from store
        if (k === '_maxAge') {
          this.#ctx.sessionOptions.maxAge = sessionData._maxAge;
        } else if (k === '_session') {
          // set maxAge to 'session' if it's a session lifetime
          this.#ctx.sessionOptions.maxAge = 'session';
        } else {
          Reflect.set(this, k, sessionData[k]);
        }
      }
    }
  }

  /**
   * JSON representation of the session.
   */
  toJSON() {
    const obj: Record<string, unknown> = {};
    for (const key in this) {
      if (key === 'isNew') continue;
      // skip private stuff
      if (key[0] === '_') continue;
      const value = this[key];
      // skip functions
      if (typeof value === 'function') continue;
      obj[key] = value;
    }
    return obj;
  }

  /**
   * alias to `toJSON`
   */
  [inspect.custom]() {
    return this.toJSON();
  }

  /**
   * Return how many values there are in the session object.
   * Used to see if it's "populated".
   */
  get length() {
    return Object.keys(this.toJSON()).length;
  }

  /**
   * populated flag, which is just a boolean alias of .length.
   */
  get populated() {
    return !!this.length;
  }

  /**
   * get session maxAge
   */
  get maxAge(): number {
    return this.#ctx.sessionOptions.maxAge;
  }

  /**
   * set session maxAge
   */
  set maxAge(val: number) {
    this.#ctx.sessionOptions.maxAge = val;
    // maxAge changed, must save to cookie and store
    this._requireSave = true;
  }

  /**
   * get session external key
   * only exist if opts.store present
   */
  get externalKey() {
    return this.#externalKey;
  }

  /**
   * save this session no matter whether it is populated
   *
   * @param {Function} [callback] the optional function to call after saving the session
   */
  save(callback?: Callback) {
    return this.commit({ save: true }, callback);
  }

  /**
   * regenerate this session
   *
   * @param  {Function} [callback] the optional function to call after regenerating the session
   */
  regenerate(callback?: Callback) {
    return this.commit({ regenerate: true }, callback);
  }

  /**
   * commit this session's headers if autoCommit is set to false
   */
  manuallyCommit() {
    return this.commit();
  }

  commit(options?: any, callback?: Callback) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    const promise = this.#sessCtx.commit(options);
    if (callback) {
      promise.then(() => callback(), callback);
    } else {
      return promise;
    }
  }
}
