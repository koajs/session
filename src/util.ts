import crc from 'crc';

export default {
  /**
   * Decode the base64 cookie value to an object
   * @private
   */
  decode(base64String: string): Record<string, unknown> {
    const body = Buffer.from(base64String, 'base64').toString('utf8');
    const json = JSON.parse(body);
    return json;
  },

  /**
   * Encode an object into a base64-encoded JSON string
   */
  encode(data: Record<string, unknown>) {
    return Buffer.from(JSON.stringify(data)).toString('base64');
  },

  hash(data: Record<string, unknown>) {
    return crc.crc32(JSON.stringify(data));
  },

  CookieDateEpoch: 'Thu, 01 Jan 1970 00:00:00 GMT',
};
