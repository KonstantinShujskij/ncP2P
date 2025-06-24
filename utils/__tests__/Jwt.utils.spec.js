// utils/__tests__/Jwt.utils.spec.js

// Спочатку мок config, щоб завжди повертати відому секретну фразу
jest.mock('config', () => ({
  get: jest.fn((key) => {
    if (key === 'authSecret') return 'mysecret';
    return undefined;
  })
}));

// Потім мок jsonwebtoken
const jwt = require('jsonwebtoken');
jwt.sign = jest.fn().mockReturnValue('signedToken');
jwt.verify = jest.fn();

const {
  generateLoginJwt,
  generateLinkJwt,
  validateLinkJwt
} = require('../Jwt.utils');

describe('Jwt.utils', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('generateLoginJwt: _id та expiresIn 24h', () => {
    const token = generateLoginJwt('user123');
    expect(jwt.sign).toHaveBeenCalledWith(
      { _id: 'user123' },
      'mysecret',
      { expiresIn: '24h' }
    );
    expect(token).toBe('signedToken');
  });

  test('generateLinkJwt: id та expiresIn 1000d', () => {
    const token = generateLinkJwt('link456');
    expect(jwt.sign).toHaveBeenCalledWith(
      { id: 'link456' },
      'mysecret',
      { expiresIn: '1000d' }
    );
    expect(token).toBe('signedToken');
  });

  test('validateLinkJwt: повертає id, якщо токен валідний', () => {
    jwt.verify.mockReturnValue({ id: 'link456' });
    const result = validateLinkJwt('someHash');
    expect(jwt.verify).toHaveBeenCalledWith('someHash', 'mysecret');
    expect(result).toBe('link456');
  });

  test('validateLinkJwt: повертає null на помилці верифікації', () => {
    jwt.verify.mockImplementation(() => { throw new Error('invalid'); });
    const result = validateLinkJwt('badHash');
    expect(result).toBeNull();
  });
});
