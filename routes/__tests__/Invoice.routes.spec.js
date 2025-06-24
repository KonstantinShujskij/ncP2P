// routes/__tests__/Invoice.routes.spec.js
const request = require('supertest');
const express = require('express');

// 1️⃣ Мокаємо middleware як jest.fn()
jest.mock('@middleware/access.middleware', () => ({
  access:        jest.fn((req, res, next) => next()),
  partnerAccess: jest.fn((req, res, next) => next())
}));
jest.mock('@middleware/auth.middleware', () => ({
  Auth:      jest.fn((req, res, next) => next()),
  isSupport: jest.fn((req, res, next) => next()),
  isMaker:   jest.fn((req, res, next) => next())
}));
jest.mock('@core/Interceptor', () => handler => (req, res, next) => {
  handler(req, res).catch(next);
});

// 2️⃣ Мокаємо JWT-утиліти
jest.mock('@utils/Jwt.utils', () => ({
  generateLinkJwt: jest.fn(id => `JWT-${id}`),
  validateLinkJwt: jest.fn(hash => hash.replace('JWT-', ''))
}));

// 3️⃣ Мокаємо контролери й задачі
jest.mock('@controllers/Invoice.controller', () => ({
  create:        jest.fn(),
  pay:           jest.fn(),
  get:           jest.fn(),
  reject:        jest.fn(),
  toValid:       jest.fn(),
  toValidOk:     jest.fn(),
  getStatistics: jest.fn(),
  list:          jest.fn()
}));
jest.mock('@controllers/Task.controller', () => ({
  push: jest.fn()
}));

// 4️⃣ Мокаємо модель Proof
jest.mock('@models/Proof.model', () => ({
  find: jest.fn()
}));

// 5️⃣ Мокаємо форматер
jest.mock('@format/Invoice.format', () => ({
  parnter: jest.fn(inv => ({ ...inv, formatted: true })),
  client:  jest.fn(inv => ({ ...inv, clientView: true })),
  admin:   jest.fn(inv => ({ ...inv, adminView: true }))
}));

// 6️⃣ Мокаємо валідацію/сереалізацію
jest.mock('@validate/Invoice.validate', () => ({
  create: (req, res, next) => next(),
  pay:    (req, res, next) => next(),
  get:    (req, res, next) => next(),
  list:   (req, res, next) => next()
}));
jest.mock('@serialize/Invoice.serialize', () => ({
  create: (req, res, next) => next(),
  pay:    (req, res, next) => next(),
  get:    (req, res, next) => next(),
  list:   (req, res, next) => next()
}));

// 7️⃣ Мокаємо config
jest.mock('config', () => ({
  get: jest.fn(key => key === 'payPageUrl' ? 'https://pay.test/' : undefined)
}));

// 8️⃣ Імпортуємо роутер
const router = require('../Invoice.routes');

// 9️⃣ Створюємо тестовий Express-app
function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/invoice', router);
  app.use((err, req, res, next) => {
    res.status(err.status || 500).send(err.msg || 'error');
  });
  return app;
}

describe('Invoice.routes', () => {
  let app;
  beforeAll(() => { app = buildApp(); });
  beforeEach(() => { jest.clearAllMocks(); });

  it('POST /invoice/create → 201 + формат + link + Task.push', async () => {
    const fake = { _id: 'A1', foo: 'bar' };
    require('@controllers/Invoice.controller').create.mockResolvedValue(fake);

    const res = await request(app)
      .post('/invoice/create')
      .send({ x: 1 });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      ...fake,
      formatted: true,
      link: 'https://pay.test/?hash=JWT-A1'
    });
  });

  it('POST /invoice/pay → 200 + parnter', async () => {
    const fake = { _id: 'B2' };
    require('@utils/Jwt.utils').validateLinkJwt.mockReturnValue('B2');
    require('@controllers/Invoice.controller').pay.mockResolvedValue(fake);

    const res = await request(app)
      .post('/invoice/pay')
      .send({ hash: 'JWT-B2' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ...fake, formatted: true });
  });

  it('POST /invoice/get → 200 + client + proofs', async () => {
    const fake = { _id: 'C3' };
    const proofs = [{ invoice: 'C3' }];
    require('@utils/Jwt.utils').validateLinkJwt.mockReturnValue('C3');
    require('@controllers/Invoice.controller').get.mockResolvedValue(fake);
    require('@models/Proof.model').find.mockResolvedValue(proofs);

    const res = await request(app)
      .post('/invoice/get')
      .send({ hash: 'JWT-C3' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      invoice: { ...fake, clientView: true },
      proofs
    });
  });

  it('POST /invoice/reject → 200 + partner', async () => {
    // Задаємо власну поведінку Auth
    const { Auth } = require('@middleware/auth.middleware');
    const user = { _id: 'U1', access: 'X' };
    Auth.mockImplementation((req, res, next) => {
      req.user = user; next();
    });

    const fake = { _id: 'D4' };
    require('@controllers/Invoice.controller').reject.mockResolvedValue(fake);

    const res = await request(app)
      .post('/invoice/reject')
      .send({ id: 'D4' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ...fake, formatted: true });
  });

  it('POST /invoice/valid → 200 + partner', async () => {
    const { Auth } = require('@middleware/auth.middleware');
    const user = { _id: 'U2' };
    Auth.mockImplementation((req, res, next) => {
      req.user = user; next();
    });
    const fake = { _id: 'E5' };
    require('@controllers/Invoice.controller').toValid.mockResolvedValue(fake);

    const res = await request(app)
      .post('/invoice/valid')
      .send({ id: 'E5' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ...fake, formatted: true });
  });

  it('POST /invoice/validOk → 200 + partner', async () => {
    const { Auth } = require('@middleware/auth.middleware');
    const user = { _id: 'U3' };
    Auth.mockImplementation((req, res, next) => {
      req.user = user; next();
    });
    const fake = { _id: 'F6' };
    require('@controllers/Invoice.controller').toValidOk.mockResolvedValue(fake);

    const res = await request(app)
      .post('/invoice/validOk')
      .send({ id: 'F6' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ...fake, formatted: true });
  });

  it('POST /invoice/statistic → 200 + statistics', async () => {
    const { Auth, isMaker } = require('@middleware/auth.middleware');
    const user = { _id: 'U4' };
    Auth.mockImplementation((req, res, next) => {
      req.user = user; next();
    });
    isMaker.mockImplementation((req, res, next) => next());

    const stats = { mono: [], privat: [] };
    require('@controllers/Invoice.controller').getStatistics.mockResolvedValue(stats);

    const res = await request(app)
      .post('/invoice/statistic')
      .send({ start: '0', stop: '1000' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(stats);
  });

  it('POST /invoice/list → 200 + list & count', async () => {
    const { Auth } = require('@middleware/auth.middleware');
    const user = { _id: 'U5' };
    Auth.mockImplementation((req, res, next) => {
      req.user = user; next();
    });

    const fakeList = [{ _id: 'L7' }, { _id: 'L8' }];
    require('@controllers/Invoice.controller').list.mockResolvedValue({
      list: fakeList,
      count: 2
    });

    const res = await request(app)
      .post('/invoice/list')
      .send({ filter: {}, page: 1, limit: 10 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      list: fakeList.map(inv => ({ ...inv, adminView: true })),
      count: 2
    });
  });
});
