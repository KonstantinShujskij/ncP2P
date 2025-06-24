// middleware/__tests__/auth.middleware.spec.js

// 0) Щоби "errors" всередині модуля посилалося на Exception.notAuth
global.errors = require('@core/Exception');

// 1) Перехоплюємо обгортку з core/Middleware
jest.mock('../../core/Middleware', () => handler => handler);

// 2) Мокаємо залежності
jest.mock('config', () => ({
  get: jest.fn(key => key === 'authSecret' ? 'SECRET' : undefined)
}));
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn()
}));
jest.mock('@controllers/User.controller', () => ({
  get: jest.fn()
}));
jest.mock('@core/Exception', () => ({
  notAuth:   { status: 401, msg: 'Bad Auth' },
  unknown:   { status: 520, msg: 'Something went wrong...' }
}));
jest.mock('@core/Const', () => ({
  userAccess: { ADMIN: 'ADMIN', MAKER: 'MAKER', SUPPORT: 'SUPPORT' }
}));

const jwt       = require('jsonwebtoken');
const User      = require('@controllers/User.controller');
const Exception = require('@core/Exception');
const Const     = require('@core/Const');

// 3) Імпортуємо тестовані middleware-і
const { Auth, isAdmin, isMaker, isSupport } = require('../auth.middleware');

describe('auth.middleware.Auth', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { headers: { authorization: '' } };
    res = {}; 
  });

  it('кидає notAuth, якщо токен відсутній', async () => {
    req.headers.authorization = 'Bearer ';
    await expect(Auth(req, res))
      .rejects.toEqual(Exception.notAuth);
  });

  it('успішно розбирає валідний токен і встановлює req.user', async () => {
    // 1) токен у заголовку
    req.headers.authorization = 'Bearer VALID_TOKEN';

    // 2) jwt.verify повертає payload з _id
    jwt.verify.mockReturnValue({ _id: 'USER123' });

    // 3) User.get повертає обʼєкт користувача
    const userObj = { _id: 'USER123', access: Const.userAccess.MAKER };
    User.get.mockResolvedValue(userObj);

    await Auth(req, res);

    expect(jwt.verify).toHaveBeenCalledWith('VALID_TOKEN', 'SECRET');
    expect(User.get).toHaveBeenCalledWith('USER123');
    expect(req.user).toBe(userObj);
  });

  it('кидає notAuth, якщо jwt.verify викидає помилку', async () => {
    req.headers.authorization = 'Bearer BAD_TOKEN';
    jwt.verify.mockImplementation(() => { throw new Error('fail'); });
    await expect(Auth(req, res))
      .rejects.toEqual(Exception.notAuth);
  });

  it('кидає notAuth, якщо User.get викидає помилку', async () => {
    req.headers.authorization = 'Bearer VALID2';
    jwt.verify.mockReturnValue({ _id: 'X' });
    User.get.mockRejectedValue(new Error('db error'));
    await expect(Auth(req, res))
      .rejects.toEqual(Exception.notAuth);
  });
});

describe('auth.middleware.isAdmin', () => {
  let req, res;
  beforeEach(() => {
    req = { user: { access: null } };
    res = {};
  });

  it('пропускає, якщо user.access = ADMIN', async () => {
    req.user.access = Const.userAccess.ADMIN;
    await expect(isAdmin(req, res)).resolves.toBeUndefined();
  });

  it('кидає notAuth для будь-якого іншого access', async () => {
    req.user.access = Const.userAccess.MAKER;
    await expect(isAdmin(req, res))
      .rejects.toEqual(Exception.notAuth);
  });
});

describe('auth.middleware.isMaker', () => {
  let req, res;
  beforeEach(() => {
    req = { user: { access: null } };
    res = {};
  });

  it('пропускає, якщо ADMIN', async () => {
    req.user.access = Const.userAccess.ADMIN;
    await expect(isMaker(req, res)).resolves.toBeUndefined();
  });
  it('пропускає, якщо MAKER', async () => {
    req.user.access = Const.userAccess.MAKER;
    await expect(isMaker(req, res)).resolves.toBeUndefined();
  });
  it('кидає notAuth для SUPPORT', async () => {
    req.user.access = Const.userAccess.SUPPORT;
    await expect(isMaker(req, res))
      .rejects.toEqual(Exception.notAuth);
  });
});

describe('auth.middleware.isSupport', () => {
  let req, res;
  beforeEach(() => {
    req = { user: { access: null } };
    res = {};
  });

  it('пропускає, якщо ADMIN', async () => {
    req.user.access = Const.userAccess.ADMIN;
    await expect(isSupport(req, res)).resolves.toBeUndefined();
  });
  it('пропускає, якщо SUPPORT', async () => {
    req.user.access = Const.userAccess.SUPPORT;
    await expect(isSupport(req, res)).resolves.toBeUndefined();
  });
  it('кидає notAuth для MAKER', async () => {
    req.user.access = Const.userAccess.MAKER;
    await expect(isSupport(req, res))
      .rejects.toEqual(Exception.notAuth);
  });
});
