jest.mock('@models/User.model', () => {
  function User(data) { Object.assign(this, data); }
  User.prototype.save = jest.fn().mockResolvedValue(jest.fn());
  User.findOne = jest.fn();
  return User;
});

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock('@utils/telegram.utils', () => ({
  sendCode: jest.fn(),
  verify: jest.fn(),
}));

const bcrypt = require('bcrypt');
const telegram = require('@utils/telegram.utils');
const User = require('@models/User.model');
const Exception = require('@core/Exception');
const {
  create,
  verify,
  twoFA,
  twoFAVerify,
  get,
} = require('@controllers/User.controller');

// Тести для функції create
describe('User.controller.create', () => {
  const login = 'user1';
  const password = 'pass123';
  const tg = 'tgId';

  beforeEach(() => jest.clearAllMocks());

  it('кидає помилку, якщо користувач із таким логіном вже існує', async () => {
    User.findOne.mockResolvedValue({});
    await expect(create(login, password, tg)).rejects.toBe(Exception.isExist);
  });

  it('створює нового користувача з хешованим паролем та зберігає його', async () => {
    User.findOne.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue('hashed');

    const saveSpy = jest.spyOn(User.prototype, 'save').mockResolvedValue({ login, password: 'hashed', telegram: tg });

    const user = await create(login, password, tg);
    expect(bcrypt.hash).toHaveBeenCalledWith(password, 12);
    expect(saveSpy).toHaveBeenCalled();
    expect(user).toEqual({ login, password: 'hashed', telegram: tg });
  });
});

// Тести для функції verify
describe('User.controller.verify', () => {
  const login = 'user1';
  const password = 'pass123';

  beforeEach(() => jest.clearAllMocks());

  it('кідає помилку notAuth, якщо користувача не знайдено', async () => {
    User.findOne.mockResolvedValue(null);
    await expect(verify(login, password)).rejects.toBe(Exception.notAuth);
  });

  it('кідає помилку notAuth, якщо пароль не збігається', async () => {
    User.findOne.mockResolvedValue({ password: 'hashed' });
    bcrypt.compare.mockResolvedValue(false);
    await expect(verify(login, password)).rejects.toBe(Exception.notAuth);
  });

  it('повертає користувача при вірних облікових даних', async () => {
    const userObj = { id: 'u1', password: 'hashed' };
    User.findOne.mockResolvedValue(userObj);
    bcrypt.compare.mockResolvedValue(true);

    const user = await verify(login, password);
    expect(bcrypt.compare).toHaveBeenCalledWith(password, userObj.password);
    expect(user).toBe(userObj);
  });
});

// Тести для функції twoFA
describe('User.controller.twoFA', () => {
  const id = 'u1';

  beforeEach(() => jest.clearAllMocks());

  it('надсилає код 2FA та зберігає його у полі twoFA', async () => {
    const userObj = { telegram: 'tg', save: jest.fn().mockResolvedValue() };
    User.findOne.mockResolvedValue(userObj);
    telegram.sendCode.mockReturnValue('codeX');

    await twoFA(id);
    expect(User.findOne).toHaveBeenCalledWith({ _id: id });
    expect(telegram.sendCode).toHaveBeenCalledWith('tg');
    expect(userObj.twoFA).toBe('codeX');
    expect(userObj.save).toHaveBeenCalled();
  });
});

// Тести для функції twoFAVerify
describe('User.controller.twoFAVerify', () => {
  const id = 'u1';

  beforeEach(() => jest.clearAllMocks());

  it('кідає помилку notAccess, якщо двофакторний код не встановлено', async () => {
    User.findOne.mockResolvedValue({ twoFA: '', telegram: 'tg' });
    await expect(twoFAVerify(id, '1234')).rejects.toBe(Exception.notAccess);
  });

  it('перевіряє код та очищує поле twoFA', async () => {
    const userObj = { twoFA: 'codeX', telegram: 'tg', save: jest.fn().mockResolvedValue() };
    User.findOne.mockResolvedValue(userObj);

    await twoFAVerify(id, 'codeX');
    expect(telegram.verify).toHaveBeenCalledWith('codeX', 'tg', 'codeX');
    expect(userObj.twoFA).toBe('');
    expect(userObj.save).toHaveBeenCalled();
  });
});

// Тести для функції get
describe('User.controller.get', () => {
  const id = 'u1';

  beforeEach(() => jest.clearAllMocks());

  it('кідає помилку notFind, якщо користувача не знайдено', async () => {
    User.findOne.mockResolvedValue(null);
    await expect(get(id)).rejects.toBe(Exception.notFind);
  });

  it('повертає користувача, якщо знайдено', async () => {
    const userObj = { id: 'u1' };
    User.findOne.mockResolvedValue(userObj);
    await expect(get(id)).resolves.toBe(userObj);
  });
});