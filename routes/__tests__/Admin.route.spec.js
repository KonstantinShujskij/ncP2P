// routes/__tests__/Admin.route.spec.js

const request = require('supertest');
const express = require('express');

// 1) Мокаємо залежності:
jest.mock('@controllers/Admin.controller', () => ({ create: jest.fn() }));
jest.mock('@controllers/Partner.controller', () => ({ create: jest.fn() }));
jest.mock('@core/Interceptor', () => handler => (req, res, next) => {
  handler(req, res).catch(next);
});
jest.mock('@middleware/access.middleware', () => ({
  access: (req, res, next) => next(),
  adminAccess: (req, res, next) => next()
}));

const AdminCtrl   = require('@controllers/Admin.controller');
const PartnerCtrl = require('@controllers/Partner.controller');

// 2) Імпортуємо роутер під тестування:
const router = require('../Admin.route'); // поправте шлях, якщо файл має іншу назву

// 3) Створюємо мінімальний Express-додаток для тестування:
function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api', router);
  // ловимо помилки, щоб supertest не зависав
  app.use((err, req, res, next) => {
    res.status(err.status || 500).send(err.msg || 'error');
  });
  return app;
}

describe('Admin.route', () => {
  let app;

  beforeAll(() => {
    app = buildApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/init-admin', () => {
    it('повертає 201 і результат Admin.create', async () => {
      const fakeAuth = { accessToken: 'A', privateToken: 'P' };
      AdminCtrl.create.mockResolvedValue(fakeAuth);

      const res = await request(app)
        .post('/api/init-admin')
        .send({});

      expect(res.status).toBe(201);
      expect(res.body).toEqual(fakeAuth);
      expect(AdminCtrl.create).toHaveBeenCalledWith('Admin');
    });
  });

  describe('POST /api/create-partner', () => {
    it('повертає 201 і результат Partner.create з body.name', async () => {
      const fakePartner = { accessToken: 'X', privateToken: 'Y' };
      PartnerCtrl.create.mockResolvedValue(fakePartner);

      const res = await request(app)
        .post('/api/create-partner')
        .send({ name: 'NewPartner' });

      expect(res.status).toBe(201);
      expect(res.body).toEqual(fakePartner);
      expect(PartnerCtrl.create).toHaveBeenCalledWith('NewPartner');
    });
  });

  describe('POST /api/create-admin', () => {
    it('повертає 201 і результат Admin.create з body.name', async () => {
      const fakeAdmin = { accessToken: 'U', privateToken: 'V' };
      AdminCtrl.create.mockResolvedValue(fakeAdmin);

      const res = await request(app)
        .post('/api/create-admin')
        .send({ name: 'SecondAdmin' });

      expect(res.status).toBe(201);
      expect(res.body).toEqual(fakeAdmin);
      expect(AdminCtrl.create).toHaveBeenCalledWith('SecondAdmin');
    });
  });
});
