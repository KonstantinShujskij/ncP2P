// routes/__tests__/Proof.routes.spec.js
const request = require('supertest');
const express = require('express');

// 1️⃣ Мок middleware
jest.mock('@middleware/auth.middleware', () => ({
  Auth:      jest.fn((req, res, next) => next()),
  isSupport: jest.fn((req, res, next) => next())
}));
jest.mock('@core/Interceptor', () => handler => (req, res, next) => {
  handler(req, res).catch(next);
});
jest.mock('@middleware/file.middleware', () => ({
  single: jest.fn(() => (req, res, next) => next())
}));

// 2️⃣ Мок контролера Proof
jest.mock('@controllers/Proof.controller', () => ({
  createByNumber: jest.fn(),
  createByFile:   jest.fn(),
  decline:        jest.fn(),
  approve:        jest.fn(),
  manual:         jest.fn(),
  recheck:        jest.fn(),
  list:           jest.fn()
}));

// 3️⃣ Мок валідацій, серіалізацій і форматерів
jest.mock('@validate/Proof.validate', () => ({
  clientNumber: jest.fn((req, res, next) => next()),
  clientFile:   jest.fn((req, res, next) => next()),
  decline:      jest.fn((req, res, next) => next()),
  approve:      jest.fn((req, res, next) => next()),
  recheck:      jest.fn((req, res, next) => next()),
  list:         jest.fn((req, res, next) => next())
}));
jest.mock('@serialize/Proof.serialize', () => ({
  clientNumber: jest.fn((req, res, next) => next()),
  clientFile:   jest.fn((req, res, next) => next()),
  decline:      jest.fn((req, res, next) => next()),
  approve:      jest.fn((req, res, next) => next()),
  recheck:      jest.fn((req, res, next) => next()),
  list:         jest.fn((req, res, next) => next())
}));
jest.mock('@format/Proof.format', () => ({
  client: jest.fn(p => ({ ...p, clientView: true })),
  admin:  jest.fn(p => ({ ...p, adminView: true }))
}));

// 4️⃣ Мок JWT-утиліти і Exception
jest.mock('@utils/Jwt.utils', () => ({
  validateLinkJwt: jest.fn()
}));
jest.mock('@core/Exception', () => ({
  invalidValue: { status: 415, msg: 'Incorrect Value' }
}));

// 5️⃣ Підключаємо роутер
const router = require('../Proof.routes');

// 6️⃣ Будуємо Express-аплікацію
function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/proof', router);
  app.use((err, req, res, next) => {
    res.status(err.status || 500).send(err.msg || 'error');
  });
  return app;
}

describe('Proof.routes', () => {
  let app;
  beforeAll(() => { app = buildApp(); });
  beforeEach(() => { jest.clearAllMocks(); });

  describe('POST /proof/create-client-number', () => {
    it('→ 201 + clientView, коли номер валідний', async () => {
      require('@utils/Jwt.utils').validateLinkJwt.mockReturnValue('INV1');
      const proof = { id: 'PR1' };
      require('@controllers/Proof.controller').createByNumber.mockResolvedValue(proof);

      const res = await request(app)
        .post('/proof/create-client-number')
        .send({ hash: 'H1', kvitNumber: 'ABCD-1234-EFGH-5678' });

      expect(res.status).toBe(201);
      expect(res.body).toEqual({ ...proof, clientView: true });
      expect(require('@controllers/Proof.controller').createByNumber)
        .toHaveBeenCalledWith('INV1', 'ABCD-1234-EFGH-5678');
    });

    it('→ 415, коли номер не відповідає формату', async () => {
      const res = await request(app)
        .post('/proof/create-client-number')
        .send({ hash: 'H1', kvitNumber: 'bad_number' });

      expect(res.status).toBe(415);
      expect(res.text).toBe('Incorrect Value');
    });
  });

  describe('POST /proof/create-client-file', () => {
    it('→ 201 + clientView, коли файл валідний', async () => {
      require('@utils/Jwt.utils').validateLinkJwt.mockReturnValue('INV2');
      const proof = { id: 'PR2' };
      require('@controllers/Proof.controller').createByFile.mockResolvedValue(proof);

        const res = await request(app)
            .post('/proof/create-client-file')
            .send({ hash: 'H2', kvitFile: 'some-file-data' });

      expect(res.status).toBe(201);
      expect(res.body).toEqual({ ...proof, clientView: true });
      expect(require('@controllers/Proof.controller').createByFile)
        .toHaveBeenCalledWith('INV2', 'some-file-data');
    });
  });

  describe('POST /proof/decline', () => {
    it('→ 200 + adminView', async () => {
      const { Auth, isSupport } = require('@middleware/auth.middleware');
      Auth.mockImplementation((req, res, next) => { req.user = {}; next(); });
      isSupport.mockImplementation((req, res, next) => next());

      const proof = { id: 'PR3' };
      require('@controllers/Proof.controller').decline.mockResolvedValue(proof);

      const res = await request(app)
        .post('/proof/decline')
        .send({ id: 'PR3' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ...proof, adminView: true });
      expect(require('@controllers/Proof.controller').decline)
        .toHaveBeenCalledWith('PR3');
    });
  });

  describe('POST /proof/accept', () => {
    it('→ 200 + adminView, коли номер ASCII', async () => {
      const { Auth, isSupport } = require('@middleware/auth.middleware');
      Auth.mockImplementation((req, res, next) => { req.user = {}; next(); });
      isSupport.mockImplementation((req, res, next) => next());

      const proof = { id: 'PR4' };
      require('@controllers/Proof.controller').approve.mockResolvedValue(proof);

      const res = await request(app)
        .post('/proof/accept')
        .send({ kvitNumber: 'ABCD-1234-EFGH-5678' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ...proof, adminView: true });
      expect(require('@controllers/Proof.controller').approve)
        .toHaveBeenCalledWith({ kvitNumber: 'ABCD-1234-EFGH-5678' });
    });

    it('→ 415, коли номер містить не-ASCII символи', async () => {
      const { Auth, isSupport } = require('@middleware/auth.middleware');
      Auth.mockImplementation((req, res, next) => { req.user = {}; next(); });
      isSupport.mockImplementation((req, res, next) => next());

      const res = await request(app)
        .post('/proof/accept')
        .send({ kvitNumber: 'абвг-1234-5678-ABCD' });

      expect(res.status).toBe(415);
      expect(res.text).toBe('Incorrect Value');
    });
  });

  describe('POST /proof/manual', () => {
    it('→ 200 + adminView', async () => {
      const { Auth, isSupport } = require('@middleware/auth.middleware');
      Auth.mockImplementation((req, res, next) => { req.user = {}; next(); });
      isSupport.mockImplementation((req, res, next) => next());

      const proof = { id: 'PR5' };
      require('@controllers/Proof.controller').manual.mockResolvedValue(proof);

      const res = await request(app)
        .post('/proof/manual')
        .send({ id: 'PR5' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ...proof, adminView: true });
      expect(require('@controllers/Proof.controller').manual)
        .toHaveBeenCalledWith('PR5');
    });
  });

  describe('POST /proof/recheck', () => {
    it('→ 200 + true, коли номер ASCII', async () => {
      const { Auth, isSupport } = require('@middleware/auth.middleware');
      Auth.mockImplementation((req, res, next) => { req.user = {}; next(); });
      isSupport.mockImplementation((req, res, next) => next());

      require('@controllers/Proof.controller').recheck.mockResolvedValue();

      const res = await request(app)
        .post('/proof/recheck')
        .send({
          id: 'PR6',
          bank: 'BANK1',
          number: 'NUM-1234-ABCD-5678'
        });

      expect(res.status).toBe(200);
      expect(res.body).toBe(true);
      expect(require('@controllers/Proof.controller').recheck)
        .toHaveBeenCalledWith('PR6', 'BANK1', 'NUM-1234-ABCD-5678');
    });

    it('→ 415, коли номер містить не-ASCII символи', async () => {
      const { Auth, isSupport } = require('@middleware/auth.middleware');
      Auth.mockImplementation((req, res, next) => { req.user = {}; next(); });
      isSupport.mockImplementation((req, res, next) => next());

      const res = await request(app)
        .post('/proof/recheck')
        .send({
          id: 'PR6',
          bank: 'BANK1',
          number: 'абвг-1234'
        });

      expect(res.status).toBe(415);
      expect(res.text).toBe('Incorrect Value');
    });
  });

  describe('POST /proof/list', () => {
    it('→ 200 + list & count', async () => {
      const { Auth } = require('@middleware/auth.middleware');
      Auth.mockImplementation((req, res, next) => {
        req.user = { id: 'USER1' };
        next();
      });

      const fakeList = [{ id: 'X1' }, { id: 'X2' }];
      require('@controllers/Proof.controller').list.mockResolvedValue({
        list: fakeList,
        count: 2
      });
      require('@format/Proof.format').admin.mockImplementation(p => ({
        ...p,
        adminView: true
      }));

      const res = await request(app)
        .post('/proof/list')
        .send({ filter: {}, page: 1, limit: 10 });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        list: fakeList.map(p => ({ ...p, adminView: true })),
        count: 2
      });
    });
  });
});
