// middleware/__tests__/logger.middleware.spec.js

jest.mock('@controllers/Log.controller', () => ({
  create: jest.fn()
}));

const Log = require('@controllers/Log.controller');
const logger = require('../logger.middleware');

describe('middleware/logger.middleware', () => {
  let req, res, next;
  const originalNow = Date.now;

  beforeEach(() => {
    jest.clearAllMocks();
    let t = 100;
    Date.now = jest.fn(() => t++);
    req = {
      url: '/test',
      method: 'POST',
      body: { foo: 'bar' },
      user: { login: 'alice' },
      skipLog: false
    };
    const fakeSend = jest.fn(b => b);
    res = {
      statusCode: 200,
      send: fakeSend
    };
    next = jest.fn();
  });

  afterAll(() => {
    Date.now = originalNow;
  });

  it('додає об’єкт req.logs та обгортає res.send', () => {
    logger(req, res, next);
    expect(req.logs).toEqual({
      url: '/test',
      method: 'POST',
      time: 100,
      req: { foo: 'bar' }
    });
    expect(typeof res.send).toBe('function');
    expect(next).toHaveBeenCalled();
  });

  it('при виклику res.send розбирає JSON, фіксує статус, тіло та тривалість і викликає Log.create', () => {
    logger(req, res, next);
    const payload = { success: true };
    const body = JSON.stringify(payload);

    const ret = res.send(body);

    expect(req.logs.statusCode).toBe(200);
    expect(req.logs.res).toEqual(payload);
    expect(req.logs.time).toBe(101 - 100);
    expect(req.logs.user).toBe('alice');
    expect(Log.create).toHaveBeenCalledWith(req.logs);
    expect(ret).toBe(body);
  });

  it('не викликає Log.create, якщо skipLog = true', () => {
    req.skipLog = true;
    logger(req, res, next);
    res.send(JSON.stringify({ ok: true }));
    expect(Log.create).not.toHaveBeenCalled();
  });

  it('обробляє некоректний JSON без помилок і повертає початковий рядок', () => {
    logger(req, res, next);
    expect(() => res.send('не-json')).not.toThrow();
    const returned = res.send('не-json');
    expect(returned).toBe('не-json');
  });
});
