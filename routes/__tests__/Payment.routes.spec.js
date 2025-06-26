// routes/__tests__/Payment.routes.spec.js
const request = require('supertest');
const express = require('express');

// 1️⃣ Мокаємо middleware як jest.fn()
jest.mock('@middleware/access.middleware', () => ({
  access:        jest.fn((req, res, next) => next()),
  partnerAccess: jest.fn((req, res, next) => next()),
  adminAccess:   jest.fn((req, res, next) => next())
}));
jest.mock('@middleware/auth.middleware', () => ({
  Auth:      jest.fn((req, res, next) => next()),
  isMaker:   jest.fn((req, res, next) => next())
}));
jest.mock('@core/Interceptor', () => handler => (req, res, next) => {
  handler(req, res).catch(next);
});

// 2️⃣ Мокаємо контролери, BlackList, Telegram та утиліти
jest.mock('@controllers/Payment.controller', () => ({
  create:         jest.fn(),
  refresh:        jest.fn(),
  pushTail:       jest.fn(),
  reject:         jest.fn(),
  freeze:         jest.fn(),
  unfreeze:       jest.fn(),
  togglePriority: jest.fn(),
  sendProofs:     jest.fn(),
  getStatistics:  jest.fn(),
  list:           jest.fn(),
  closeTail:      jest.fn()
}));
jest.mock('@controllers/BlackList.controller', () => ({
  find:   jest.fn(),
  create: jest.fn()
}));
jest.mock('@utils/telegram.utils', () => ({
  sendProofs: jest.fn()
}));

// 3️⃣ Мокаємо форматери, валідацію, серіалізацію
jest.mock('@format/Payment.format', () => ({
  parnter: jest.fn(p => ({ ...p, formatted: true })),
  admin:   jest.fn(p => ({ ...p, adminView: true }))
}));
jest.mock('@validate/Payment.validate', () => ({
  create: jest.fn((req, res, next) => next()),
  get:    jest.fn((req, res, next) => next()),
  block:  jest.fn((req, res, next) => next()),
  list:   jest.fn((req, res, next) => next())
}));
jest.mock('@serialize/Payment.serialize', () => ({
  create: jest.fn((req, res, next) => next()),
  get:    jest.fn((req, res, next) => next()),
  block:  jest.fn((req, res, next) => next()),
  list:   jest.fn((req, res, next) => next())
}));

// 4️⃣ Мокаємо Exception
jest.mock('@core/Exception', () => ({
  cardBlocked: { status: 409, msg: 'Card is Blocked' }
}));

// 5️⃣ Імпортуємо наш роутер
const router = require('../Payment.routes');

// 6️⃣ Створюємо тестовий Express-app
function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/payment', router);
  app.use((err, req, res, next) => {
    res.status(err.status || 500).send(err.msg || 'error');
  });
  return app;
}

describe('Payment.routes', () => {
  let app;
  beforeAll(() => { app = buildApp(); });
  beforeEach(() => { jest.clearAllMocks(); });

  describe('POST /payment/create', () => {
    it('→ 201, коли картка не в блеклісті, повертає форматоване payment', async () => {
      // Налаштовуємо access, щоб задати req.access.id
      const { access } = require('@middleware/access.middleware');
      access.mockImplementation((req, res, next) => {
        req.access = { id: 'ACC1' };
        next();
      });

      require('@controllers/BlackList.controller').find.mockResolvedValue(false);
      const fake = { id: 'P1' };
      require('@controllers/Payment.controller').create.mockResolvedValue(fake);

      const res = await request(app)
        .post('/payment/create')
        .send({ card: '123', amount: 10 });

      expect(res.status).toBe(201);
      expect(res.body).toEqual({ ...fake, formatted: true });
    });

    it('→ 409, якщо картка заблокована', async () => {
      const { access } = require('@middleware/access.middleware');
      access.mockImplementation((req, res, next) => {
        req.access = { id: 'ACC1' };
        next();
      });

      require('@controllers/BlackList.controller').find.mockResolvedValue(true);

      const res = await request(app)
        .post('/payment/create')
        .send({ card: '123' });

      expect(res.status).toBe(409);
      expect(res.text).toBe('Card is Blocked');
    });
  });

  describe('POST /payment/create-admin', () => {
    it('→ 201, коли картка не в блеклісті, створює з даними з req.user', async () => {
      const { Auth } = require('@middleware/auth.middleware');
      Auth.mockImplementation((req, res, next) => {
        req.user = { accessId: 'A1', login: 'bob' };
        next();
      });
      require('@controllers/BlackList.controller').find.mockResolvedValue(false);

      const fake = { id: 'P2' };
      require('@controllers/Payment.controller').create.mockResolvedValue(fake);

      const res = await request(app)
        .post('/payment/create-admin')
        .send({ card: '321', amount: 20 });

      expect(res.status).toBe(201);
      expect(require('@controllers/Payment.controller').create)
        .toHaveBeenCalledWith(
          { accessId: 'A1', author: 'bob' },
          { card: '321', amount: 20 }
        );
      expect(res.body).toEqual({ ...fake, formatted: true });
    });
  });

  it('POST /payment/refresh → 200 і повертає true', async () => {
    const res = await request(app)
      .post('/payment/refresh')
      .send({ id: 'X1' });

    expect(res.status).toBe(200);
    expect(res.body).toBe(true);
    expect(require('@controllers/Payment.controller').refresh)
      .toHaveBeenCalledWith('X1');
  });

  it('POST /payment/block → 200 і створює BlackList.create', async () => {
    const { Auth } = require('@middleware/auth.middleware');
    Auth.mockImplementation((req, res, next) => {
      req.user = { accessId: 'A2', login: 'x' };
      next();
    });

    const res = await request(app)
      .post('/payment/block')
      .send({ card: '5555' });

    expect(res.status).toBe(200);
    expect(require('@controllers/BlackList.controller').create)
      .toHaveBeenCalledWith('5555');
    expect(res.body).toBe(true);
  });

  it('POST /payment/push → 200 і викликає pushTail', async () => {
    const { Auth } = require('@middleware/auth.middleware');
    Auth.mockImplementation((req, res, next) => {
      req.user = { accessId: 'A3', login: 'y' };
      next();
    });

    const res = await request(app)
      .post('/payment/push')
      .send({ id: 'ID3' });

    expect(res.status).toBe(200);
    expect(require('@controllers/Payment.controller').pushTail)
      .toHaveBeenCalledWith({ accessId: 'A3', login: 'y' }, 'ID3');
    expect(res.body).toBe(true);
  });

  it('POST /payment/reject → 200 і викликає reject', async () => {
    const { Auth } = require('@middleware/auth.middleware');
    Auth.mockImplementation((req, res, next) => {
      req.user = { accessId: 'A4', login: 'z' };
      next();
    });

    const res = await request(app)
      .post('/payment/reject')
      .send({ id: 'ID4' });

    expect(res.status).toBe(200);
    expect(require('@controllers/Payment.controller').reject)
      .toHaveBeenCalledWith({ accessId: 'A4', login: 'z' }, 'ID4');
    expect(res.body).toBe(true);
  });

  it('POST /payment/freeze → 200 і викликає freeze', async () => {
    const { Auth } = require('@middleware/auth.middleware');
    Auth.mockImplementation((req, res, next) => {
      req.user = { accessId: 'A5', login: 'w' };
      next();
    });

    const res = await request(app)
      .post('/payment/freeze')
      .send({ id: 'ID5' });

    expect(res.status).toBe(200);
    expect(require('@controllers/Payment.controller').freeze)
      .toHaveBeenCalledWith({ accessId: 'A5', login: 'w' }, 'ID5');
    expect(res.body).toBe(true);
  });

  it('POST /payment/unfreeze → 200 і викликає unfreeze', async () => {
    const { Auth } = require('@middleware/auth.middleware');
    Auth.mockImplementation((req, res, next) => {
      req.user = { accessId: 'A6', login: 'v' };
      next();
    });

    const res = await request(app)
      .post('/payment/unfreeze')
      .send({ id: 'ID6' });

    expect(res.status).toBe(200);
    expect(require('@controllers/Payment.controller').unfreeze)
      .toHaveBeenCalledWith({ accessId: 'A6', login: 'v' }, 'ID6');
    expect(res.body).toBe(true);
  });

  it('POST /payment/toggle-priority → 200 і викликає togglePriority', async () => {
    const { Auth } = require('@middleware/auth.middleware');
    Auth.mockImplementation((req, res, next) => {
      req.user = { accessId: 'A7', login: 'u' };
      next();
    });

    const res = await request(app)
      .post('/payment/toggle-priority')
      .send({ id: 'ID7' });

    expect(res.status).toBe(200);
    expect(require('@controllers/Payment.controller').togglePriority)
      .toHaveBeenCalledWith({ accessId: 'A7', login: 'u' }, 'ID7');
    expect(res.body).toBe(true);
  });

  it('POST /payment/proofs → 200 і викликає sendProofs та повертає true', async () => {
    const { Auth } = require('@middleware/auth.middleware');
    Auth.mockImplementation((req, res, next) => {
      req.user = { accessId: 'A8', login: 't', telegram: 'TG' };
      next();
    });
    const proofs = ['p1','p2'];
    require('@controllers/Payment.controller').sendProofs.mockResolvedValue(proofs);

    const res = await request(app)
      .post('/payment/proofs')
      .send({ id: 'ID8' });

    expect(res.status).toBe(200);
    expect(require('@utils/telegram.utils').sendProofs)
      .toHaveBeenCalledWith(proofs, 'TG');
    expect(res.body).toBe(true);
  });

  it('POST /payment/statistic → 200 і повертає статистику', async () => {
    const { Auth, isMaker } = require('@middleware/auth.middleware');
    Auth.mockImplementation((req, res, next) => {
      req.user = { accessId: 'A9', login: 's' };
      next();
    });
    isMaker.mockImplementation((req, res, next) => next());

    const stats = { total: 5 };
    require('@controllers/Payment.controller').getStatistics.mockResolvedValue(stats);

    const res = await request(app)
      .post('/payment/statistic')
      .send({ start: '0', stop: '999' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(stats);
  });

  it('POST /payment/order/update → 200 і повертає true', async () => {
    const res = await request(app)
      .post('/payment/order/update')
      .send({ id: 'Z1', status: 'ok' });

    expect(res.status).toBe(200);
    expect(require('@controllers/Payment.controller').closeTail)
      .toHaveBeenCalledWith('Z1', 'ok');
    expect(res.body).toBe(true);
  });

  it('POST /payment/list → 200 + adminView & count', async () => {
    const { Auth } = require('@middleware/auth.middleware');
    Auth.mockImplementation((req, res, next) => {
      req.user = { accessId: 'A10', login: 'r' };
      next();
    });

    const fake = [{ id: 'L1' }, { id: 'L2' }];
    require('@controllers/Payment.controller').list.mockResolvedValue({
      list: fake, count: 2
    });
    require('@format/Payment.format').admin.mockImplementation(p => ({ ...p, adminView: true }));

    const res = await request(app)
      .post('/payment/list')
      .send({ filter: {}, page:1, limit:10 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      list: fake.map(p => ({ ...p, adminView: true })),
      count: 2
    });
  });
});
