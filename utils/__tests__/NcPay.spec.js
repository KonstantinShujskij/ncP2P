// utils/__tests__/NcPay.spec.js

jest.mock('config', () => ({
  get: jest.fn(key => {
    if (key === 'NcPayUrl') return 'http://ncpay';
    return '';
  })
}));
jest.mock('../request', () => ({
  protectedCallback: jest.fn()
}));
jest.mock('../telegram.utils', () => ({
  cantSendCallback: jest.fn()
}));

const config = require('config');
const { protectedCallback } = require('../request');
const { cantSendCallback } = require('../telegram.utils');
const { callback } = require('../NcPay');

describe('utils/NcPay.callback', () => {
  const invoice = { id: 'INV1', amount: 123, user: 'U1' };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    console.log.mockRestore();
  });

  it('успішно викликає protectedCallback з правильним URL та body', () => {
    const cb = jest.fn();

    callback(invoice, cb);

    expect(config.get).toHaveBeenCalledWith('NcPayUrl');
    expect(console.log).toHaveBeenCalledWith('Send to NcPay');
    expect(console.log).toHaveBeenCalledWith('url:', 'http://ncpay/invoice/ncp2p');
    expect(protectedCallback).toHaveBeenCalledWith(
      'http://ncpay/invoice/ncp2p',
      invoice,
      cb
    );
    expect(cantSendCallback).not.toHaveBeenCalled();
  });

  it('при помилці в protectedCallback викликає cantSendCallback та не кидає', () => {
    protectedCallback.mockImplementation(() => { throw new Error('fail'); });
    const cb = jest.fn();

    expect(() => callback(invoice, cb)).not.toThrow();
    expect(cantSendCallback).toHaveBeenCalledWith('INV1');
  });
});
