// core/__tests__/Middleware.spec.js

jest.mock('../Exception', () => ({
  unknown: { status: 520, msg: 'Something went wrong...' }
}));

const Exception = require('../Exception');
const createMiddleware = require('../Middleware');

describe('core/Middleware', () => {
  let req, res, next, callback;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { method: 'GET' };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    callback = jest.fn().mockResolvedValue();
  });

  it('пропускає OPTIONS-запит до next без виклику callback', async () => {
    req.method = 'OPTIONS';
    const mw = createMiddleware(callback);
    await mw(req, res, next);

    expect(callback).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it('успішно виконує callback і викликає next', async () => {
    const mw = createMiddleware(callback);
    await mw(req, res, next);

    expect(callback).toHaveBeenCalledWith(req, res);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it('якщо callback викидає Exception зі status, повертає його помилку', async () => {
    const customEx = { status: 404, msg: 'Not Found' };
    callback.mockRejectedValue(customEx);

    const mw = createMiddleware(callback);
    await mw(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith('Not Found');
  });

  it('якщо callback викидає невідому помилку без status, повертає Exception.unknown', async () => {
    callback.mockRejectedValue(new Error('boom'));

    const mw = createMiddleware(callback);
    await mw(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(Exception.unknown.status);
    expect(res.json).toHaveBeenCalledWith(Exception.unknown.msg);
  });
});
