// utils/__tests__/toObjectId.spec.js
const { toObjectId } = require('../utils');
const { Types } = require('mongoose');

describe('toObjectId()', () => {
  it('повертає ObjectId для валідного 24-символьного hex-рядка', () => {
    const hex = '507f1f77bcf86cd799439011';
    const objId = toObjectId(hex);

    expect(objId).toBeInstanceOf(Types.ObjectId);
    expect(objId.toString()).toBe(hex);
  });

  it('повертає null для рядка, що містить не-hex-символи', () => {
    expect(toObjectId('not-a-hex-string')).toBeNull();
    expect(toObjectId('xyz123xyz123xyz123xyz123')).toBeNull();
  });
});
