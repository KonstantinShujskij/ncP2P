// layers/controllers/__tests__/Log.controller.spec.js
const Exception = require('@core/Exception');
const Const = require('@core/Const');

// Мокаємо Log та Invoice моделі
jest.mock('@models/Log.model', () => {
  const findOne = jest.fn();
  const MODEL = function(data) {
    Object.assign(this, data);
    this._id = this._id || 'LOG_NEW';
    this.save = jest.fn().mockResolvedValue(this);
  };
  MODEL.findOne = findOne;
  return MODEL;
});
jest.mock('@models/Invoice.model', () => ({
  aggregate: jest.fn()
}));

const LogModel = require('@models/Log.model');
const InvoiceModel = require('@models/Invoice.model');

// Inject global Invoice for controller
beforeAll(() => {
  global.Invoice = InvoiceModel;
});

const { create, getAutoStatistic, get } = require('../Log.controller');

describe('Log.controller', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('create()', () => {
    it('створює новий Log та викликає save', async () => {
      const data = { level: 'INFO', message: 'Test log' };
      const result = await create(data);
      expect(result).toMatchObject({ level: 'INFO', message: 'Test log', _id: 'LOG_NEW' });
      expect(typeof result.save).toBe('function');
    });
  });

  describe('get()', () => {
    it('повертає log, якщо знайдено', async () => {
      const fakeLog = { _id: 'L1', level: 'ERR', message: 'Error' };
      LogModel.findOne.mockResolvedValueOnce(fakeLog);
      const out = await get('L1');
      expect(LogModel.findOne).toHaveBeenCalledWith({ _id: 'L1' });
      expect(out).toBe(fakeLog);
    });

    it('викидає Exception.notFind, якщо нема Log', async () => {
      LogModel.findOne.mockResolvedValueOnce(null);
      await expect(get('UNKNOWN')).rejects.toBe(Exception.notFind);
    });
  });

  describe('getAutoStatistic()', () => {
    const start = 100;
    const stop = 200;
    const monoStats = [{ count: 10, countConfirm: 5, conversion: 0.5 }];
    const privatStats = [{ count: 20, countConfirm: 10, conversion: 0.5 }];

    beforeEach(() => {
      InvoiceModel.aggregate
        .mockResolvedValueOnce(monoStats)
        .mockResolvedValueOnce(privatStats);
    });

    it('передає правильні опції та повертає статистику', async () => {
      const stats = await getAutoStatistic(null, start, stop);
      expect(InvoiceModel.aggregate).toHaveBeenNthCalledWith(1, [
        { $match: { createdAt: { $gt: start, $lt: stop }, method: Const.bankList.MONO } },
        expect.any(Object),
        expect.any(Object)
      ]);
      expect(InvoiceModel.aggregate).toHaveBeenNthCalledWith(2, [
        { $match: { createdAt: { $gt: start, $lt: stop }, method: Const.bankList.MONO } },
        expect.any(Object),
        expect.any(Object)
      ]);
      expect(stats).toEqual({ mono: monoStats, privat: privatStats });
    });

    it('повертає порожні масиви, якщо агрегації нічого не повернули', async () => {
      // Очищуємо всі once-міткалки і повертаємо порожній масив для кожного виклику
      InvoiceModel.aggregate.mockReset();
      InvoiceModel.aggregate.mockResolvedValue([]);
      const stats = await getAutoStatistic(null);
      expect(stats).toEqual({ mono: [], privat: [] });
    });
    });
  });

