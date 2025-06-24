// utils/__tests__/Kvits.utils.spec.js

jest.mock('node-fetch');
jest.mock('config', () => ({
  get: jest.fn(key => {
    if (key === 'checkGovUrl') return 'https://gov';
    if (key === 'privatUrl') return 'https://privat';
    return '';
  })
}));

// Тепер можна мокати alias-и без правок у тестах
jest.mock('@core/Const', () => ({
  bankList: { MONO: 'MONO', PRIVAT: 'PRIVAT' }
}));
jest.mock('@controllers/Log.controller', () => ({
  create: jest.fn()
}));

const fetch = require('node-fetch');
const config = require('config');
const Const = require('@core/Const');
const Log = require('@controllers/Log.controller');
const { checkMono, checkPrivat, checkByBank } = require('../Kvits.utils');

describe('utils/Kvits.utils', () => {
  beforeEach(() => jest.clearAllMocks());

  const mockFetchResponse = data => ({
    json: jest.fn().mockResolvedValue(data)
  });

  it('checkMono: успішний виклик і лог створюється', async () => {
    const data = { card: '123', amount: 50 };
    fetch.mockResolvedValue(mockFetchResponse(data));

    const result = await checkMono('NUM1');

    expect(fetch).toHaveBeenCalledWith(
      'https://gov/check',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: 'NUM1' })
      })
    );
    expect(Log.create).toHaveBeenCalledWith(expect.objectContaining({
      url: 'https://gov/check',
      method: Const.bankList.MONO,
      req: { number: 'NUM1' },
      statusCode: 200,
      res: data
    }));
    expect(result).toEqual(data);
  });

  it('checkPrivat: відповіді немає → statusCode "Have not data"', async () => {
    fetch.mockResolvedValue(mockFetchResponse(null));

    const result = await checkPrivat('NUM2');

    expect(fetch).toHaveBeenCalledWith(
      'https://privat/check',
      expect.any(Object)
    );
    expect(Log.create).toHaveBeenCalledWith(expect.objectContaining({
      url: 'https://privat/check',
      method: Const.bankList.PRIVAT,
      req: { number: 'NUM2' },
      statusCode: 'Have not data'
    }));
    expect(result).toBeNull();
  });

  it('checkByBank: викликає правильний метод або повертає null для невідомого банку', async () => {
    fetch.mockResolvedValue(mockFetchResponse({ card: 'x', amount: 1 }));

    const mono = await checkByBank(Const.bankList.MONO, 'A');
    const privat = await checkByBank(Const.bankList.PRIVAT, 'B');
    const none = await checkByBank('OTHER', 'C');

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(mono).toEqual({ card: 'x', amount: 1 });
    expect(privat).toEqual({ card: 'x', amount: 1 });
    expect(none).toBeNull();
  });

  it('при помилці fetch → statusCode "Not have Responce"', async () => {
    fetch.mockImplementation(() => { throw new Error(); });

    const result = await checkMono('NUM3');
    expect(result).toBeNull();
    expect(Log.create).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 'Not have Responce'
    }));
  });
});
