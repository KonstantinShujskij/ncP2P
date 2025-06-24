// utils/__tests__/auth.utils.spec.js

// 1) Мок модуля config
jest.mock('config', () => ({
  get: jest.fn((key) => {
    if (key === 'jwtSecret') return 'jwt_secret';
    if (key === 'apiSecret') return 'api_secret';
  })
}));

// 2) Мок jsonwebtoken
const jwt = require('jsonwebtoken');
jwt.sign = jest.fn();

// 3) Мок generate-key
jest.mock('generate-key', () => ({
  generateKey: jest.fn().mockReturnValue({
    toString: () => 'PRIVATE_TOKEN'
  })
}));

// 4) Розмокаємо alias @core/Const, щоб мати відомі ролі
jest.mock('@core/Const', () => ({
  access: {
    ADMIN: 'ADMIN',
    PARTNER: 'PARTNER'
  }
}));

// Після моків – підвантажуємо наші функції
const { createAdmin, createPartner } = require('../auth.utils');
const config = require('config');
const keyGen = require('generate-key');
const Const = require('@core/Const');

describe('auth.utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createAdmin()', () => {
    it('генерує accessToken та hashedToken зі строкою PRIVATE_TOKEN', () => {
      // Налаштовуємо jwt.sign: спочатку для access, потім для hashed
      jwt.sign
        .mockReturnValueOnce('ACCESS_TOKEN')
        .mockReturnValueOnce('HASHED_TOKEN');

      const result = createAdmin('user123');

      // Перевіряємо, що згенеровано приватний токен
      expect(keyGen.generateKey).toHaveBeenCalledWith(32);
      expect(result.privateToken).toBe('PRIVATE_TOKEN');

      // Перша підпись: payload { id, access }
      expect(jwt.sign).toHaveBeenNthCalledWith(
        1,
        { id: 'user123', access: Const.access.ADMIN },
        'jwt_secret',
        { expiresIn: '100000d' }
      );
      expect(result.accessToken).toBe('ACCESS_TOKEN');

      // Друга підпись: payload { privateToken }
      expect(jwt.sign).toHaveBeenNthCalledWith(
        2,
        { privateToken: 'PRIVATE_TOKEN' },
        'api_secret',
        { expiresIn: '100000d' }
      );
      expect(result.hashedToken).toBe('HASHED_TOKEN');
    });
  });

  describe('createPartner()', () => {
    it('генерує accessToken з роллю PARTNER', () => {
      jwt.sign
        .mockReturnValueOnce('PARTNER_ACCESS')
        .mockReturnValueOnce('PARTNER_HASH');

      const result = createPartner('partnerXYZ');

      expect(keyGen.generateKey).toHaveBeenCalledWith(32);
      expect(result.privateToken).toBe('PRIVATE_TOKEN');

      expect(jwt.sign).toHaveBeenNthCalledWith(
        1,
        { id: 'partnerXYZ', access: Const.access.PARTNER },
        'jwt_secret',
        { expiresIn: '100000d' }
      );
      expect(result.accessToken).toBe('PARTNER_ACCESS');

      expect(jwt.sign).toHaveBeenNthCalledWith(
        2,
        { privateToken: 'PRIVATE_TOKEN' },
        'api_secret',
        { expiresIn: '100000d' }
      );
      expect(result.hashedToken).toBe('PARTNER_HASH');
    });
  });
});
