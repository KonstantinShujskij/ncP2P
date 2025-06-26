// routes/__tests__/User.routes.spec.js
const request = require('supertest');
const express = require('express');

// 1️⃣ Мокаємо middleware-і
jest.mock('@middleware/auth.middleware', () => ({
  Auth:    jest.fn((req, res, next) => next()),
  isAdmin: jest.fn((req, res, next) => next()),
  isMaker: jest.fn((req, res, next) => next()),
  isSupport: jest.fn((req, res, next) => next())
}));
jest.mock('@core/Interceptor', () => handler => (req, res, next) => void handler(req, res).catch(next));

// 2️⃣ Мокаємо всі контролери і утиліти
jest.mock('@controllers/User.controller', () => ({
  create:       jest.fn(),
  verify:       jest.fn(),
  twoFA:        jest.fn(),
  twoFAVerify:  jest.fn()
}));
jest.mock('@controllers/Log.controller', () => ({
  getAutoStatistic: jest.fn()
}));
jest.mock('@utils/Jwt.utils', () => ({
  generateLoginJwt: jest.fn()
}));

// 3️⃣ Мокаємо валідатори, серіалізатори і форматери
jest.mock('@validate/User.validate', () => ({
  create: jest.fn((req, res, next) => next()),
  login:  jest.fn((req, res, next) => next())
}));
jest.mock('@serialize/User.serialize', () => ({
  crerate: jest.fn((req, res, next) => next()),
  login:   jest.fn((req, res, next) => next()),
  twoFA:   jest.fn((req, res, next) => next())
}));
jest.mock('@format/User.format', () => ({
  admin: jest.fn(u => ({ ...u, formatted: true }))
}));

// 4️⃣ Підключаємо роутер
const router = require('../User.routes');

// 5️⃣ Збираємо тестовий express-додаток
function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/user', router);
  // простий error handler
  app.use((err, req, res, next) => {
    res.status(err.status || 500).send(err.msg || 'error');
  });
  return app;
}

describe('User.routes', () => {
  let app;
  beforeAll(() => {
    app = buildApp();
  });
  beforeEach(() => jest.clearAllMocks());

  describe('POST /user/create', () => {
    it('→ 201 + відформатований user', async () => {
      const fakeUser = { _id: 'U1', login: 'L1', access: 'A' };
      require('@controllers/User.controller').create.mockResolvedValue(fakeUser);

      const res = await request(app)
        .post('/user/create')
        .send({ login: 'L1', password: 'P1', telegram: 'T1' });

      expect(res.status).toBe(201);
      expect(res.body).toEqual({ ...fakeUser, formatted: true });
      expect(require('@controllers/User.controller').create)
        .toHaveBeenCalledWith('L1', 'P1', 'T1');
    });
  });

  describe('POST /user/2fa', () => {
    it('→ 201, коли успішно виконується twoFA', async () => {
      const fakeUser = { _id: 'U2' };
      require('@controllers/User.controller').verify.mockResolvedValue(fakeUser);
      require('@controllers/User.controller').twoFA.mockResolvedValue();

      const res = await request(app)
        .post('/user/2fa')
        .send({ login: 'L2', password: 'P2' });

      expect(res.status).toBe(201);
      expect(res.body).toBe(true);
      expect(require('@controllers/User.controller').verify).toHaveBeenCalledWith('L2', 'P2');
      expect(require('@controllers/User.controller').twoFA).toHaveBeenCalledWith('U2');
    });
  });

  describe('POST /user/login', () => {
    it('→ 200 + токен і дані користувача', async () => {
      const fakeUser = { _id: 'U3', id: 'U3', access: 'ADMIN' };
      require('@controllers/User.controller').verify.mockResolvedValue(fakeUser);
      require('@controllers/User.controller').twoFAVerify.mockResolvedValue();
      require('@utils/Jwt.utils').generateLoginJwt.mockReturnValue('JWT3');

      const res = await request(app)
        .post('/user/login')
        .send({ login: 'L3', password: 'P3', code: 'C3' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ token: 'JWT3', userId: 'U3', access: 'ADMIN' });
      expect(require('@controllers/User.controller').verify).toHaveBeenCalledWith('L3', 'P3');
      expect(require('@controllers/User.controller').twoFAVerify).toHaveBeenCalledWith('U3', 'C3');
    });
  });

  describe('POST /user/autoStatistic', () => {
    it('→ 200 + дані статистики', async () => {
      // Зімітуємо, що Auth кладе req.user
      const { Auth, isMaker } = require('@middleware/auth.middleware');
      Auth.mockImplementation((req, res, next) => {
        req.user = 'USER_ID';
        next();
      });

      const fakeStats = { mono: 5, privat: 3 };
      require('@controllers/Log.controller').getAutoStatistic.mockResolvedValue(fakeStats);

      const res = await request(app)
        .post('/user/autoStatistic')
        .send({ start: '1000', stop: '2000' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(fakeStats);
      expect(require('@controllers/Log.controller').getAutoStatistic)
        .toHaveBeenCalledWith('USER_ID', 1000, 2000);
    });
  });
});
