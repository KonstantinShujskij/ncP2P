// core/__tests__/Interceptor.spec.js

// 1) Мокаємо express-validator перед імпортом модуля
jest.mock('express-validator', () => ({
  validationResult: jest.fn()
}));

const { validationResult } = require('express-validator');
const Exception       = require('../Exception');
const Interceptor     = require('../Interceptor');

describe('core/Interceptor', () => {
  let req, res, handler;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {};    
    res = {
      skipLog: undefined,
      status: jest.fn().mockReturnThis(),
      json:   jest.fn()
    };

    handler = jest.fn().mockResolvedValue();
  });

  it('пропускає запит до handler, якщо немає помилок валідації', async () => {
    // Мокаємо validationResult так, щоб не було помилок
    validationResult.mockReturnValue({ array: () => [] });

    const wrapped = Interceptor(handler);
    await wrapped(req, res);

    expect(handler).toHaveBeenCalledWith(req, res);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it('якщо є помилка валідації, кидає відповідний Exception і повертає статус/повідомлення', async () => {
    const fakeMsg = 'invalidId';
    // Один обʼєкт у масиві — беремо його .msg
    validationResult.mockReturnValue({
      array: () => [{ msg: fakeMsg }]
    });

    const wrapped = Interceptor(handler);
    await wrapped(req, res);

    expect(handler).not.toHaveBeenCalled();
    expect(res.skipLog).toBe(false);
    expect(res.status).toHaveBeenCalledWith(Exception[fakeMsg].status);
    expect(res.json).toHaveBeenCalledWith(Exception[fakeMsg].msg);
  });

  it('якщо handler кидає власний Exception, повертає його статус і повідомлення', async () => {
    validationResult.mockReturnValue({ array: () => [] });
    const customEx = Exception.notAccess;
    handler.mockRejectedValue(customEx);

    const wrapped = Interceptor(handler);
    await wrapped(req, res);

    expect(res.skipLog).toBe(false);
    expect(res.status).toHaveBeenCalledWith(customEx.status);
    expect(res.json).toHaveBeenCalledWith(customEx.msg);
  });

  it('якщо handler кидає невідомий виняток, повертає Exception.unknown', async () => {
    validationResult.mockReturnValue({ array: () => [] });
    handler.mockRejectedValue(new Error('boom'));

    const wrapped = Interceptor(handler);
    await wrapped(req, res);

    expect(res.skipLog).toBe(false);
    expect(res.status).toHaveBeenCalledWith(Exception.unknown.status);
    expect(res.json).toHaveBeenCalledWith(Exception.unknown.msg);
  });
});
