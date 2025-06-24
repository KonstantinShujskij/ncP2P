// layers/controllers/__tests__/Admin.controller.spec.js

const Exception = require('@core/Exception');

// 1️⃣ Мокаємо утиліту auth.utils
jest.mock('@utils/auth.utils', () => ({
  createAdmin: jest.fn()
}));

// 2️⃣ Мокаємо модель Admin.model
const saveMock = jest.fn();
const findOneMock = jest.fn();
const AdminMock = jest.fn(function (data) {
  // конструктор приймає { name }
  this.name = data.name;
  this._id = 'ADMIN_ID';
  this.accessToken = undefined;
  this.privateToken = undefined;
  this.hashedToken = undefined;
  this.save = saveMock;
});
// Підбираємо імпорт так, щоб controller взяв саме цей мок
jest.mock('@models/Admin.model', () => AdminMock);

// 3️⃣ Підключаємо тестований модуль
const { create, get } = require('../Admin.controller');
const authUtils = require('@utils/auth.utils');

describe('Admin.controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create()', () => {
    it('генерує токени через auth.createAdmin, зберігає в модель та повертає лише accessToken і privateToken', async () => {
      // Налаштуємо мок createAdmin так, ніби він повернув такі значення
      authUtils.createAdmin.mockReturnValue({
        accessToken: 'ATOKEN',
        privateToken: 'PTOKEN',
        hashedToken: 'HASHED'
      });

      // Викликаємо
      const result = await create('MyAdmin');

      // Має повернути тільки дві властивості
      expect(result).toEqual({
        accessToken: 'ATOKEN',
        privateToken: 'PTOKEN'
      });

      // Перевіряємо, що модель сконструйована з переданим name
      expect(AdminMock).toHaveBeenCalledWith({ name: 'MyAdmin' });

      // Має встановити полe accessToken та privateToken на інстансі
      const instance = AdminMock.mock.instances[0];
      expect(instance.accessToken).toBe('ATOKEN');
      expect(instance.privateToken).toBe('HASHED');

      // Має викликати save()
      expect(saveMock).toHaveBeenCalled();
    });
  });

  describe('get()', () => {
    it('повертає знайденого admin-а, якщо він є', async () => {
      // Задаємо, що знайшли обʼєкт
      const fakeAdmin = { _id: 'ID1', name: 'A1' };
      findOneMock.mockResolvedValue(fakeAdmin);

      // Назовні модель шукає через findOne
      AdminMock.findOne = findOneMock;

      const result = await get('ID1');
      expect(AdminMock.findOne).toHaveBeenCalledWith({ _id: 'ID1' });
      expect(result).toBe(fakeAdmin);
    });

    it('кидає Exception.notFind, якщо admin не знайдено', async () => {
      findOneMock.mockResolvedValue(null);
      AdminMock.findOne = findOneMock;

      await expect(get('NOPE')).rejects.toBe(Exception.notFind);
      expect(AdminMock.findOne).toHaveBeenCalledWith({ _id: 'NOPE' });
    });
  });
});
