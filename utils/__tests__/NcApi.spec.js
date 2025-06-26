// utils/__tests__/NcApi.spec.js

jest.mock('config', () => ({
  get: jest.fn(key => {
    switch (key) {
      case 'serverUrl': return 'http://server';
      case 'NcApiUrl':  return 'http://api';
      case 'maker':     return 'MAKER_ID';
      default:          return '';
    }
  })
}));
jest.mock('../request', () => ({
  protectedRecuest: jest.fn()
}));
jest.mock('../telegram.utils', () => ({
  cantNcApiMake: jest.fn()
}));

const config = require('config');
const { protectedRecuest } = require('../request');
const { cantNcApiMake } = require('../telegram.utils');
const { makeSubscribe, makeOrder } = require('../NcApi');

describe('utils/NcApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('makeSubscribe()', () => {
    it('викликає protectedRecuest з правильним URL та body', () => {
      makeSubscribe();

      expect(config.get).toHaveBeenCalledWith('NcApiUrl');
      expect(protectedRecuest).toHaveBeenCalledWith(
        'http://api/subscribe/on',
        { url: 'http://server/api/payment' },
        expect.any(Function)
      );
    });

    it('виконує внутрішній callback і не падає (покриває console.log)', () => {
      let savedHandler;
      protectedRecuest.mockImplementation((url, body, handler) => {
        savedHandler = handler;
      });

      makeSubscribe();

      // Переконатися, що ми отримали callback
      expect(typeof savedHandler).toBe('function');

      // Викликаємо його з фейковим response
      expect(() => savedHandler({ statusCode: 201, body: { ok: true } })).not.toThrow();
      // (console.log всередині callback тепер виконано)
    });

    it('не кидає помилку, якщо protectedRecuest вибухає', () => {
      protectedRecuest.mockImplementation(() => { throw new Error('fail'); });
      expect(() => makeSubscribe()).not.toThrow();
    });
  });

  describe('makeOrder()', () => {
    it('викликає protectedRecuest з правильними параметрами і передає callback', () => {
      const cb = jest.fn();
      makeOrder('CARD1', 500, 'REF123', cb);

      expect(config.get).toHaveBeenCalledWith('NcApiUrl');
      expect(config.get).toHaveBeenCalledWith('maker');

      expect(protectedRecuest).toHaveBeenCalledWith(
        'http://api/order/create',
        {
          maker: 'MAKER_ID',
          currency: 'uah',
          card: 'CARD1',
          value: 500,
          referenceId: 'REF123'
        },
        cb
      );
    });

    it('при помилці в try-catch викликає cantNcApiMake', () => {
      protectedRecuest.mockImplementation(() => { throw 'err'; });
      expect(() => makeOrder('CARD2', 1000, 'REF2')).not.toThrow();
      expect(cantNcApiMake).toHaveBeenCalledWith('REF2');
    });
  });
});
