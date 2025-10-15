import crc from 'crc';

export default {
  /**
   * Decode a base64-encoded cookie value into a JSON object.
   * @param {string} base64String Base64-encoded string produced by {@link encode}
   * @private
   * @return {Record<string, unknown>} Parsed session data object
   */
  decode(base64String: string): Record<string, unknown> {
    const body = Buffer.from(base64String, 'base64').toString('utf8');
    const json = JSON.parse(body);
    return json;
  },

  /**
   * Encode an object into a base64-encoded JSON string.
   * @param {Record<string, unknown>} data Serializable session payload
   * @return {string} Base64-encoded JSON string
   */
  encode(data: Record<string, unknown>) {
    return Buffer.from(JSON.stringify(data)).toString('base64');
  },

  /**
   * Compute CRC32 hash of a JSON-serialized payload.
   * @param {Record<string, unknown>} data Serializable payload to hash
   * @return {number} CRC32 hash value
   */
  hash(data: Record<string, unknown>) {
    return crc.crc32(JSON.stringify(data));
  },

  CookieDateEpoch: 'Thu, 01 Jan 1970 00:00:00 GMT',
};
