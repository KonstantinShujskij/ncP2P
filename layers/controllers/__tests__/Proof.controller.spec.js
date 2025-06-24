// Спочатку — мок функцій до імпорту контролера
jest.mock('@utils/pdf.utils', () => ({
  getBankByKvit: jest.fn(),
  getKvitNumber: jest.fn(),
  getPrivatKvitNumber: jest.fn(),
}));

jest.mock('@controllers/Invoice.controller', () => ({ get: jest.fn() }));
jest.mock('@controllers/Payment.controller', () => ({ softGet: jest.fn() }));
jest.mock('@utils/DropBox', () => ({ saveKvit: jest.fn() }));

jest.mock('@controllers/Proof.controller', () => {
  const original = jest.requireActual('@controllers/Proof.controller');
  return {
    ...original,
    verify: jest.fn().mockResolvedValue(true),
    gpt: jest.fn().mockResolvedValue(true),
  };
});

// Після моків — імпортуємо все інше
const controller = require('@controllers/Proof.controller');
const pdfUtils = require('@utils/pdf.utils');
const DropBox = require('@utils/DropBox');
const Proof = require('@models/Proof.model');
const Invoice = require('@controllers/Invoice.controller');
const Payment = require('@controllers/Payment.controller');
const Exception = require('@core/Exception');
const Const = require('@core/Const');

describe('Proof.controller сервіс', () => {
  const invoiceId = 'inv123';
  const fileBuffer = Buffer.from('dummy');

  beforeEach(() => {
    jest.clearAllMocks();

    Proof.find = jest.fn();
    Invoice.get = jest.fn();
    Payment.softGet = jest.fn();
    DropBox.saveKvit = jest.fn();

    // Повертаємо повноцінний об'єкт, щоб не було undefined
    Proof.prototype.save = jest.fn().mockImplementation(function () {
      return Promise.resolve({
        invoice: this.invoice,
        kvitNumber: this.kvitNumber,
        invoiceSubstatus: this.invoiceSubstatus,
        fileLink: this.fileLink,
        kvitFile: this.kvitFile,
        _id: 'mocked-id'
      });
    });
  });

  describe('createByNumber', () => {
    it('повинна кидати invalidValue, якщо номер порожній', async () => {
      await expect(controller.createByNumber(invoiceId, '')).rejects.toBe(Exception.invalidValue);
    });

    it('повинна кидати manyProofs, якщо ≥2 активних', async () => {
      Proof.find.mockResolvedValue([{}, {}]);
      await expect(controller.createByNumber(invoiceId, 'ABC')).rejects.toBe(Exception.manyProofs);
    });

    it('повинна кидати notFind, якщо рахунок CONFIRM', async () => {
      Proof.find.mockResolvedValue([]);
      Invoice.get.mockResolvedValue({ status: Const.invoice.statusList.CONFIRM });
      await expect(controller.createByNumber(invoiceId, 'ABC')).rejects.toBe(Exception.notFind);
    });


    it('повинна виставити підстатус VALID-OK при validOk=true', async () => {
      Proof.find.mockResolvedValue([]);
      Invoice.get.mockResolvedValue({
        status: Const.invoice.statusList.VALID,
        validOk: true,
        refId: 'r3', partnerId: 'p3', initialAmount: 300,
        card: '3333', createdAt: Date.now(), bank: 'B3',
        client: 'c3', conv: {}, confirm: false, payment: 'p3',
      });
      Payment.softGet.mockResolvedValue({ accessId: 'a3', refId: 'r3', partnerId: 'p3' });

      const proof = await controller.createByNumber(invoiceId, 'zzz');
      expect(proof.invoiceSubstatus).toBe('VALID-OK');
      expect(Proof.prototype.save).toHaveBeenCalled();
    });
  });

  describe('createByFile', () => {
    it('повинна кидати invalidValue, якщо файл порожній', async () => {
      await expect(controller.createByFile(invoiceId, '')).rejects.toBe(Exception.invalidValue);
    });

    it('генерує номер MONO та зберігає файл', async () => {
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
      expect(pdfUtils.getBankByKvit).toHaveBeenCalled();
      expect(pdfUtils.getKvitNumber).toHaveBeenCalled();
      expect(DropBox.saveKvit).toHaveBeenCalled();
      expect(proof.kvitNumber).toBe('07B4-BMME-1319-M28C');
      expect(proof.fileLink).toBe('link');
      expect(Proof.prototype.save).toHaveBeenCalled();
    });

    it('генерує номер PRIVAT для банку Privat', async () => {
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
      expect(pdfUtils.getBankByKvit).toHaveBeenCalled();
      expect(pdfUtils.getPrivatKvitNumber).toHaveBeenCalled();
      expect(DropBox.saveKvit).toHaveBeenCalled();
      expect(proof.kvitNumber).toBe('P24A4500985774D2427');
      expect(proof.fileLink).toBe('link4');
      expect(Proof.prototype.save).toHaveBeenCalled();
    });
  });
});
