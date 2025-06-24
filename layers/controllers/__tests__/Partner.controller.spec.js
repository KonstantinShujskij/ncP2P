// layers/controllers/__tests__/Partner.controller.spec.js

// 1. Моки мають оголошуватися до будь-яких require
jest.mock('@utils/auth.utils', () => ({
  createPartner: jest.fn(),
}));

jest.mock('@models/Partner.model', () => {
  const findOne = jest.fn();
  // MODEL – це jest.fn-конструктор
  const MODEL = jest.fn(function(data) {
    Object.assign(this, data);
    this._id = this._id || 'P_NEW';
    // save прив’язано до кожного екземпляра
    this.save = jest.fn().mockResolvedValue(this);
  });
  MODEL.findOne = findOne;
  return MODEL;
});

// 2. Тільки тепер підключаємо справжні залежності
const auth = require('@utils/auth.utils');
const Exception = require('@core/Exception');
const PartnerModel = require('@models/Partner.model');
const { create, get } = require('../Partner.controller');

describe('Partner.controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create()', () => {
    it('генерує токени, зберігає партнера і повертає токени', async () => {
      // Підготувати мок токенів
      auth.createPartner.mockReturnValue({
        privateToken: 'priv123',
        accessToken: 'acc123',
        hashedToken: 'hashXYZ',
      });

      // Виклик create()
      const result = await create('MyPartner');

      // 1) auth.createPartner мав отримати id нового партнера
      expect(auth.createPartner).toHaveBeenCalledWith('P_NEW');

      // 2) PartnerModel як mock-конструктор мав створити один екземпляр
      expect(PartnerModel).toHaveBeenCalledWith({ name: 'MyPartner' });
      const instances = PartnerModel.mock.instances;
      expect(instances.length).toBe(1);

      // 3) У цього екземпляра мав викликатись save()
      expect(instances[0].save).toHaveBeenCalled();

      // 4) Повернуті токени правильні
      expect(result).toEqual({
        accessToken: 'acc123',
        privateToken: 'priv123',
      });
    });
  });

  describe('get()', () => {
    it('повертає партнера, якщо знайдено', async () => {
      const fake = { _id: 'X1', name: 'Foo' };
      PartnerModel.findOne.mockResolvedValueOnce(fake);

      const out = await get('X1');

      expect(PartnerModel.findOne).toHaveBeenCalledWith({ _id: 'X1' });
      expect(out).toBe(fake);
    });

    it('викидає Exception.notFind, якщо партнера нема', async () => {
      PartnerModel.findOne.mockResolvedValueOnce(null);
      await expect(get('NOPE')).rejects.toBe(Exception.notFind);
    });
  });
});
