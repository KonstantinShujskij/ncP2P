// layers/controllers/__tests__/BlackList.controller.spec.js

const Exception = require('@core/Exception');

// Моки для моделі
const saveMock = jest.fn();
const findOneMock = jest.fn();
const deleteOneMock = jest.fn();

const CardMock = jest.fn(function (data) {
  this.card = data.card;
  this.isActive = true;
  this._id = 'ID_CARD';
  this.save = saveMock;
});
CardMock.findOne = findOneMock;
CardMock.deleteOne = deleteOneMock;

jest.mock('@models/BlackList.model', () => CardMock);

// Підключаємо контролер
const {
  create,
  find,
  remove,
  del,
  get
} = require('../BlackList.controller');

describe('BlackList.controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('find()', () => {
    it('повертає знайдену картку', async () => {
      findOneMock.mockResolvedValue({ card: '123', isActive: true });
      const res = await find('123');
      expect(findOneMock).toHaveBeenCalledWith({ card: '123', isActive: true });
      expect(res).toEqual({ card: '123', isActive: true });
    });

    it('повертає null, якщо не знайдено', async () => {
      findOneMock.mockResolvedValue(null);
      const res = await find('999');
      expect(findOneMock).toHaveBeenCalledWith({ card: '999', isActive: true });
      expect(res).toBeNull();
    });
  });

  describe('create()', () => {
    it('повертає існуючу, якщо вона є в БД', async () => {
      findOneMock.mockResolvedValue({ card: 'ABC', isActive: true });
      const res = await create('ABC');
      expect(findOneMock).toHaveBeenCalledWith({ card: 'ABC', isActive: true });
      expect(res).toEqual({ card: 'ABC', isActive: true });
      expect(CardMock).not.toHaveBeenCalled();
      expect(saveMock).not.toHaveBeenCalled();
    });

    it('створює і зберігає нову картку, якщо її не було', async () => {
      findOneMock.mockResolvedValue(null);
      const saved = { card: 'XYZ', isActive: true, _id: 'ID_CARD' };
      saveMock.mockResolvedValue(saved);

      const res = await create('XYZ');
      expect(CardMock).toHaveBeenCalledWith({ card: 'XYZ' });
      expect(saveMock).toHaveBeenCalled();
      expect(res).toBe(saved);
    });
  });

  describe('remove()', () => {
    it('видаляє існуючу картку через del() і повертає результат', async () => {
      const existing = { _id: 'ID1', card: 'C1', isActive: true };
      findOneMock.mockResolvedValue(existing);
      deleteOneMock.mockResolvedValue({ deletedCount: 1 });

      const res = await remove('C1');
      expect(findOneMock).toHaveBeenCalledWith({ card: 'C1', isActive: true });
      expect(deleteOneMock).toHaveBeenCalledWith({ _id: 'ID1' });
      expect(res).toEqual({ deletedCount: 1 });
    });

    it('повертає null, якщо картки немає', async () => {
      findOneMock.mockResolvedValue(null);
      const res = await remove('NOCARD');
      expect(findOneMock).toHaveBeenCalledWith({ card: 'NOCARD', isActive: true });
      expect(res).toBeNull();
      expect(deleteOneMock).not.toHaveBeenCalled();
    });
  });

  describe('del()', () => {
    it('успішно видаляє через Card.deleteOne і повертає результат', async () => {
      deleteOneMock.mockResolvedValue({ deletedCount: 2 });
      const res = await del('ID2');
      expect(deleteOneMock).toHaveBeenCalledWith({ _id: 'ID2' });
      expect(res).toEqual({ deletedCount: 2 });
    });

    it('повертає null при помилці', async () => {
      deleteOneMock.mockRejectedValue(new Error('oops'));
      const res = await del('ID3');
      expect(deleteOneMock).toHaveBeenCalledWith({ _id: 'ID3' });
      expect(res).toBeNull();
    });
  });

  describe('get()', () => {
    it('повертає знайдену картку', async () => {
      const found = { _id: 'IDX', card: 'C2' };
      findOneMock.mockResolvedValue(found);
      const res = await get('IDX');
      expect(findOneMock).toHaveBeenCalledWith({ _id: 'IDX' });
      expect(res).toBe(found);
    });

    it('кидає Exception.notFind, якщо не знайдено', async () => {
      findOneMock.mockResolvedValue(null);
      await expect(get('NOID')).rejects.toBe(Exception.notFind);
    });
  });
});
