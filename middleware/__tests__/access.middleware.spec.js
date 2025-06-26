// middleware/__tests__/access.middleware.spec.js

// 1) Підміна обгортки middleware
jest.mock('../../core/Middleware', () => handler => handler);

// 2) Мок моделі: тепер вони лежать в layers/models
jest.mock('../../layers/models/Admin.model.js', () => ({
  findOne: jest.fn()
}));
jest.mock('../../layers/models/Partner.model.js', () => ({
  findOne: jest.fn()
}));

// 3) Інші залежності
jest.mock('config', () => ({
  get: jest.fn(key => {
    switch (key) {
      case 'jwtSecret': return 'JWT_SECRET';
      case 'apiSecret': return 'API_SECRET';
      default:           return '';
    }
  })
}));
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn()
}));
jest.mock('@core/Const', () => ({
  access: { ADMIN: 'ADMIN', PARTNER: 'PARTNER' }
}));
jest.mock('@core/Exception', () => ({
  notAuth:   { status: 401, msg: 'Bad Auth' },
  notAccess: { status: 401, msg: 'Not Access' },
  unknown:   { status: 520, msg: 'Something went wrong...' }
}));
jest.mock('node:crypto', () => ({
  createHmac: jest.fn()
}));

const jwt       = require('jsonwebtoken');
const Admin     = require('../../layers/models/Admin.model.js');
const Partner   = require('../../layers/models/Partner.model.js');
const Const     = require('@core/Const');
const Exception = require('@core/Exception');
const { createHmac } = require('node:crypto');

// 4) Імпорт тестованого middleware
const { access, adminAccess, partnerAccess } = require('../access.middleware');

describe('access.middleware', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      body: {},
      header: jest.fn().mockReturnValue(undefined),
      socket: { remoteAddress: '1.2.3.4' }
    };
    res = {};
  });

  it('успішно авторизує ADMIN без whitelist та встановлює req.access', async () => {
    jwt.verify
      .mockReturnValueOnce({ id: 'UID', access: Const.access.ADMIN })
      .mockReturnValueOnce({ privateToken: 'PVT' });

    Admin.findOne.mockResolvedValue({ whiteList: [], privateToken: 'ENC' });
    Partner.findOne.mockResolvedValue(null);

    const fakeHash = 'GOOD';
    createHmac.mockReturnValue({ update: () => ({ digest: () => fakeHash }) });

    req.body = { accessToken: 'AT', foo: 'bar', signature: fakeHash };

    await access(req, res);
    expect(req.access).toEqual({ id: 'UID', type: Const.access.ADMIN });
  });

  it('успішно авторизує PARTNER з перевіркою whitelist', async () => {
    jwt.verify
      .mockReturnValueOnce({ id: 'PID', access: Const.access.PARTNER })
      .mockReturnValueOnce({ privateToken: 'PVT2' });

    Partner.findOne.mockResolvedValue({ whiteList: ['1.2.3.4'], privateToken: 'ENC2' });
    Admin.findOne.mockResolvedValue(null);

    const fakeHash = 'OK';
    createHmac.mockReturnValue({ update: () => ({ digest: () => fakeHash }) });

    req.body = { accessToken: 'PT', x: 1, signature: fakeHash };
    req.header.mockReturnValue('1.2.3.4');

    await access(req, res);
    expect(req.access).toEqual({ id: 'PID', type: Const.access.PARTNER });
  });

  it('відмовляє, якщо користувача не знайдено ⇒ Exception.notAuth', async () => {
    jwt.verify.mockReturnValue({ id: 'X', access: Const.access.ADMIN });
    Admin.findOne.mockResolvedValue(null);
    Partner.findOne.mockResolvedValue(null);

    req.body = { accessToken: 'AT', signature: 'H' };
    await expect(access(req, res)).rejects.toEqual(Exception.notAuth);
  });

  it('відмовляє, якщо IP не в whitelist ⇒ Exception.notAccess', async () => {
    jwt.verify
      .mockReturnValueOnce({ id: 'U', access: Const.access.PARTNER })
      .mockReturnValueOnce({ privateToken: 'PVT3' });

    Partner.findOne.mockResolvedValue({ whiteList: ['8.8.8.8'], privateToken: 'ENC3' });
    Admin.findOne.mockResolvedValue(null);

    createHmac.mockReturnValue({ update: () => ({ digest: () => 'H1' }) });
    req.body = { accessToken: 'PT', signature: 'H1' };
    req.header.mockReturnValue('1.2.3.4');

    await expect(access(req, res)).rejects.toEqual(Exception.notAccess);
  });

  it('відмовляє, якщо підпис некоректний ⇒ Exception.notAuth', async () => {
    jwt.verify
      .mockReturnValueOnce({ id: 'UID', access: Const.access.ADMIN })
      .mockReturnValueOnce({ privateToken: 'PVT4' });

    Admin.findOne.mockResolvedValue({ whiteList: [], privateToken: 'ENC4' });
    Partner.findOne.mockResolvedValue(null);

    createHmac.mockReturnValue({ update: () => ({ digest: () => 'WRONG' }) });
    req.body = { accessToken: 'AT', signature: 'NOT' };

    await expect(access(req, res)).rejects.toEqual(Exception.notAuth);
  });
});

describe('adminAccess middleware', () => {
  let req, res;

  beforeEach(() => {
    req = { access: { type: null } };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  });

  it('пропускає ADMIN', async () => {
    req.access.type = Const.access.ADMIN;
    await expect(adminAccess(req, res)).resolves.toBeUndefined();
  });

  it('відмовляє для не-ADMIN ⇒ Exception.notAccess', async () => {
    req.access.type = Const.access.PARTNER;
    await expect(adminAccess(req, res)).rejects.toEqual(Exception.notAccess);
  });
});

describe('partnerAccess middleware', () => {
  let req, res;

  beforeEach(() => {
    req = { access: { type: null } };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  });

  it('пропускає PARTNER', async () => {
    req.access.type = Const.access.PARTNER;
    await expect(partnerAccess(req, res)).resolves.toBeUndefined();
  });

  it('відмовляє для не-PARTNER ⇒ Exception.notAccess', async () => {
    req.access.type = Const.access.ADMIN;
    await expect(partnerAccess(req, res)).rejects.toEqual(Exception.notAccess);
  });
});
