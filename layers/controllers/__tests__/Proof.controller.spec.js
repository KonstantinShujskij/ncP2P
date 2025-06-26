// proof.controller.test.js

process.on('unhandledRejection', () => {});

// --- Mock dependencies before importing controller ---
jest.mock('config', () => ({}));

// PDF utils
jest.mock('@utils/pdf.utils', () => ({
  getBankByKvit: jest.fn(),
  getKvitNumber: jest.fn(),
  getPrivatKvitNumber: jest.fn(),
}));

// GPT utils
jest.mock('@utils/gpt.utils', () => ({
  getImageData: jest.fn(),
  getPdfData: jest.fn(),
}));

// DropBox
jest.mock('@utils/DropBox', () => ({ saveKvit: jest.fn() }));

// Invoice & Payment controllers
jest.mock('@controllers/Invoice.controller', () => ({ get: jest.fn(), close: jest.fn() }));
jest.mock('@controllers/Payment.controller', () => ({ softGet: jest.fn(), get: jest.fn() }));

// Exception & Const
jest.mock('@core/Exception', () => ({
  invalidValue: new Error('invalidValue'),
  manyProofs: new Error('manyProofs'),
  notFind: new Error('notFind'),
  isExist: new Error('isExist'),
  notCanSaveModel: new Error('notCanSaveModel'),
}));
jest.mock('@core/Const', () => ({
  bankList: { MONO: 'MONO', PRIVAT: 'PRIVAT' },
  proof: {
    activeStatusList: ['WAIT', 'MANUAL'],
    statusList: { CONFIRM: 'CONFIRM', REJECT: 'REJECT', MANUAL: 'MANUAL', WAIT: 'WAIT' },
  },
  invoice: { statusList: { CONFIRM: 'CONFIRM', VALID: 'VALID', NEW: 'NEW' } },
  userAccess: { MAKER: 'MAKER' }
}));

// Proof model
jest.mock('@models/Proof.model', () => {
  class MockProof {
    constructor(data) { Object.assign(this, data); }
  }
  // Spy on prototype.save for all instances
  MockProof.prototype.save = jest.fn().mockImplementation(function() { return Promise.resolve(this); });
  MockProof.find = jest.fn();
  MockProof.findOne = jest.fn();
  MockProof.countDocuments = jest.fn();
  return MockProof;
});

// Kvits utils
jest.mock('@utils/Kvits.utils', () => ({ checkMono: jest.fn(), checkPrivat: jest.fn() }));

// Now import controller under test
const controller = require('@controllers/Proof.controller');
const Const = require('@core/Const');
const Exception = require('@core/Exception');
const Proof = require('@models/Proof.model');
const Invoice = require('@controllers/Invoice.controller');
const Payment = require('@controllers/Payment.controller');
const DropBox = require('@utils/DropBox');
const pdfUtils = require('@utils/pdf.utils');
const Kvits = require('@utils/Kvits.utils');
const Gpt = require('@utils/gpt.utils');

// Shared values
const invoiceId = 'inv123';
const fileBuffer = Buffer.from('dummy');

beforeEach(() => {
  jest.clearAllMocks();
  // Default findOne to a valid proof skeleton
  Proof.findOne.mockResolvedValue({
    _id: 'proof1',
    kvitNumber: '',
    kvitFile: 'fallback.pdf',
    bank: 'PRIVAT',
    invoiceAmount: 100,
    invoiceDate: Date.now(),
    payment: 'PAY123',
    status: 'WAIT',
    gpt: {},
    save: jest.fn().mockResolvedValue(true)
  });
});

describe('Proof.controller сервіс', () => {
  describe('createByNumber', () => {
    it('повинна кидати invalidValue, якщо kvitNumber порожній', async () => {
      await expect(controller.createByNumber(invoiceId, '')).rejects.toBe(Exception.invalidValue);
    });

    it('повинна кидати manyProofs, якщо ≥2 активних підтверджень', async () => {
      Proof.find.mockResolvedValue([{}, {}]);
      await expect(controller.createByNumber(invoiceId, 'ABC')).rejects.toBe(Exception.manyProofs);
    });

    it('повинна кидати notFind, якщо статус рахунку CONFIRM', async () => {
      Proof.find.mockResolvedValue([]);
      Invoice.get.mockResolvedValue({ status: Const.invoice.statusList.CONFIRM });
      await expect(controller.createByNumber(invoiceId, 'ABC')).rejects.toBe(Exception.notFind);
    });

    it('ставить підстатус VALID-OK при validOk=true', async () => {
      Proof.find.mockResolvedValue([]);
      Invoice.get.mockResolvedValue({
        status: Const.invoice.statusList.VALID,
        validOk: true,
        initialAmount: 300,
        card: '3333',
        createdAt: Date.now(),
        bank: 'B3',
        refId: 'r3',
        partnerId: 'p3',
        client: 'c3',
        conv: {},
        confirm: false,
        payment: 'p3',
      });
      Payment.softGet.mockResolvedValue({ accessId: 'a3', refId: 'r3', partnerId: 'p3' });

      const proof = await controller.createByNumber(invoiceId, 'zzz');
      expect(proof.invoiceSubstatus).toBe('VALID-OK');
      expect(Proof.prototype.save).toHaveBeenCalled();
    });
  });

  describe('createByFile', () => {
    it('повинна кидати invalidValue, якщо kvitFile порожній', async () => {
      await expect(controller.createByFile(invoiceId, '')).rejects.toBe(Exception.invalidValue);
    });

    it('генерує номер MONO та зберігає kvitFile', async () => {
      Proof.find.mockResolvedValue([]);
      Invoice.get.mockResolvedValue({
        status: Const.invoice.statusList.NEW,
        refId: 'r2', partnerId: 'p2', initialAmount: 200,
        card: '1111', createdAt: Date.now(), bank: 'B2',
        client: 'c2', conv: {}, confirm: false, validOk: true,
      });
      pdfUtils.getBankByKvit.mockResolvedValue(Const.bankList.MONO);
      pdfUtils.getKvitNumber.mockResolvedValue('07B4-BMME-1319-M28C');
      Payment.softGet.mockResolvedValue({ accessId: 'a2', refId: 'r2', partnerId: 'p2' });
      DropBox.saveKvit.mockResolvedValue('link');

      const proof = await controller.createByFile(invoiceId, fileBuffer);
      expect(pdfUtils.getBankByKvit).toHaveBeenCalledWith(fileBuffer);
      expect(pdfUtils.getKvitNumber).toHaveBeenCalledWith(fileBuffer);
      expect(DropBox.saveKvit).toHaveBeenCalledWith(fileBuffer);
      expect(proof.kvitNumber).toBe('07B4-BMME-1319-M28C');
      expect(proof.fileLink).toBe('link');
      expect(Proof.prototype.save).toHaveBeenCalled();
    });

    it('генерує номер PRIVAT для банку PRIVAT', async () => {
      Proof.find.mockResolvedValue([]);
      Invoice.get.mockResolvedValue({
        status: Const.invoice.statusList.NEW,
        refId: 'r4', partnerId: 'p4', initialAmount: 400,
        card: '4444', createdAt: Date.now(), bank: 'B4',
        client: 'c4', conv: {}, confirm: false, validOk: false,
      });
      pdfUtils.getBankByKvit.mockResolvedValue(Const.bankList.PRIVAT);
      pdfUtils.getPrivatKvitNumber.mockResolvedValue('P24A4500985774D2427');
      Payment.softGet.mockResolvedValue({ accessId: 'a4', refId: 'r4', partnerId: 'p4' });
      DropBox.saveKvit.mockResolvedValue('link4');

      const proof = await controller.createByFile(invoiceId, fileBuffer);
      expect(pdfUtils.getBankByKvit).toHaveBeenCalledWith(fileBuffer);
      expect(pdfUtils.getPrivatKvitNumber).toHaveBeenCalledWith(fileBuffer);
      expect(DropBox.saveKvit).toHaveBeenCalledWith(fileBuffer);
      expect(proof.kvitNumber).toBe('P24A4500985774D2427');
      expect(proof.fileLink).toBe('link4');
      expect(Proof.prototype.save).toHaveBeenCalled();
    });
  });

  describe('verify', () => {
    it('викликає checkMono для MONO-квитанції', async () => {
      const kv = 'M37H-290X-5HE7-B0MA';
      const mock = { _id: '1', kvitNumber: kv, bank: '', save: jest.fn().mockResolvedValue(true), invoiceAmount: 100, invoiceDate: Date.now(), payment: 'P1' };
      Proof.findOne.mockResolvedValueOnce(mock).mockResolvedValueOnce(mock);
      Kvits.checkMono.mockResolvedValue(null);
      Kvits.checkPrivat.mockResolvedValue(null);

      await controller.verify('1');
      expect(Kvits.checkMono).toHaveBeenCalledWith(kv);
      expect(Kvits.checkPrivat).not.toHaveBeenCalled();
    });
  });
})