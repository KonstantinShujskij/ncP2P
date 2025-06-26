// utils/__tests__/request.spec.js

// 1) Мок config перед усіма імпортами
jest.mock('config', () => ({
  get: jest.fn(key => {
    switch (key) {
      case 'accessToken': return 'ACCESS_TOKEN';
      case 'privateToken': return 'PRIVATE_TOKEN';
      case 'accessTokenNcPay': return 'ACCESS_TOKEN_NCPAY';
      case 'privateTokenNcPay': return 'PRIVATE_TOKEN_NCPAY';
      default: return undefined;
    }
  })
}));

// 2) Мок request та crypto
jest.mock('request');
jest.mock('node:crypto', () => ({
  createHmac: jest.fn(() => ({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn(() => 'SIGNATURE')
  }))
}));

const config = require('config');
const request = require('request');
const { createHmac } = require('node:crypto');

// Після моків – імпортуємо методи
const {
  protectedRecuest,
  protectedCallback
} = require('../request');

describe('utils/request.js', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('protectedRecuest()', () => {
    it('додає accessToken і signature у body та викликає handler із response', () => {
      const handler = jest.fn();
      const url = 'https://api.test';
      const payload = { foo: 'bar' };

      protectedRecuest(url, payload, handler);

      expect(config.get).toHaveBeenCalledWith('accessToken');
      expect(config.get).toHaveBeenCalledWith('privateToken');

      // Перевіряємо виклик request.post
      expect(request.post).toHaveBeenCalledTimes(1);
      const [options, cb] = request.post.mock.calls[0];

      // Опції мають містити:
      expect(options).toMatchObject({
        url,
        headers: { 'content-type': 'application/json' },
        json: true
      });

      // Body має містити accessToken, оригінальні поля і signature
      expect(options.body).toEqual({
        accessToken: 'ACCESS_TOKEN',
        foo: 'bar',
        signature: 'SIGNATURE'
      });

      // Симулюємо callback
      const fakeRes = { status: 200 };
      cb(null, fakeRes);
      expect(handler).toHaveBeenCalledWith(fakeRes);
    });
  });

  describe('protectedCallback()', () => {
    it('додає NcPay-токени і signature, викликає handler із response', () => {
      const handler = jest.fn();
      const url = 'https://nc.test';
      const payload = { x: 42 };

      protectedCallback(url, payload, handler);

      expect(config.get).toHaveBeenCalledWith('accessTokenNcPay');
      expect(config.get).toHaveBeenCalledWith('privateTokenNcPay');

      expect(request.post).toHaveBeenCalledTimes(1);
      const [options, cb] = request.post.mock.calls[0];

      expect(options).toMatchObject({
        url,
        headers: { 'content-type': 'application/json' },
        json: true
      });

      expect(options.body).toEqual({
        accessToken: 'ACCESS_TOKEN_NCPAY',
        x: 42,
        signature: 'SIGNATURE'
      });

      // Симулюємо помилку та response
      const fakeRes = { status: 500 };
      cb('some error', fakeRes);
      expect(handler).toHaveBeenCalledWith(fakeRes);
    });
  });
});
