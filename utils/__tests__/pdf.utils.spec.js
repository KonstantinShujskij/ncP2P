// utils/__tests__/pdf.utils.spec.js

// 1) Мок констант із core/Const.js
jest.mock('../../core/Const', () => ({
  bankList: {
    MONO: 'MONO',
    PRIVAT: 'PRIVAT'
  }
}));

// 2) Мок fs та pdf-parse
jest.mock('fs');
jest.mock('pdf-parse');

const fs = require('fs');
const pdfParse = require('pdf-parse');
const Const = require('../../core/Const');
const pdfUtils = require('../pdf.utils');

const {
  getKvitText,
  getKvitNumber,
  getPrivatKvitNumber,
  getBankByKvit
} = pdfUtils;

describe('utils/pdf.utils', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('getKvitText()', () => {
    it('повертає null, якщо файл не знайдено', async () => {
      fs.existsSync.mockReturnValue(false);

      const result = await getKvitText('fake.pdf');
      expect(result).toBeNull();
      expect(fs.existsSync).toHaveBeenCalledWith(expect.stringContaining('fake.pdf'));
    });

    it('повертає текст з pdf-parse', async () => {
      fs.existsSync.mockReturnValue(true);
      const fakeBuf = Buffer.from('dummy');
      fs.readFileSync.mockReturnValue(fakeBuf);
      pdfParse.mockResolvedValue({ text: 'PDF CONTENT' });

      const text = await getKvitText('file.pdf');
      expect(fs.readFileSync).toHaveBeenCalledWith(expect.stringContaining('file.pdf'));
      expect(pdfParse).toHaveBeenCalledWith(fakeBuf);
      expect(text).toBe('PDF CONTENT');
    });

    it('на помилці повертає null', async () => {
      fs.existsSync.mockImplementation(() => { throw new Error('oops'); });
      const result = await getKvitText('file.pdf');
      expect(result).toBeNull();
    });
  });

  describe('getKvitNumber()', () => {
    const sample = '… ABCD-1234-EFGH-5678 …';

    beforeEach(() => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(Buffer.from('dummy'));
      pdfParse.mockResolvedValue({ text: sample });
    });

    it('витягує номер формату XXXX-XXXX-XXXX-XXXX', async () => {
      const num = await getKvitNumber('ignored.pdf');
      expect(num).toBe('ABCD-1234-EFGH-5678');
    });

    it('якщо немає матчу – повертає null', async () => {
      pdfParse.mockResolvedValue({ text: 'no codes here' });
      const num = await getKvitNumber('ignored.pdf');
      expect(num).toBeNull();
    });
  });

  describe('getPrivatKvitNumber()', () => {
    const sample = '…P24ABCDEFGHIJKLMNOP…';

    beforeEach(() => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(Buffer.from('dummy'));
      pdfParse.mockResolvedValue({ text: sample });
    });

    it('витягує номер, що починається з P24 і має 16 символів далі', async () => {
      const num = await getPrivatKvitNumber('ignored.pdf');
      expect(num).toBe('P24ABCDEFGHIJKLMNOP');
    });

    it('якщо нема – повертає null', async () => {
      pdfParse.mockResolvedValue({ text: '' });
      const num = await getPrivatKvitNumber('ignored.pdf');
      expect(num).toBeNull();
    });
  });

  describe('getBankByKvit()', () => {
    beforeEach(() => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(Buffer.from('dummy'));
    });

    it('повертає MONO коли бачить "Телефон: 0 800 205 205"', async () => {
      pdfParse.mockResolvedValue({ text: '…Телефон: 0 800 205 205…' });
      const bank = await getBankByKvit('ignored.pdf');
      expect(bank).toBe(Const.bankList.MONO);
    });

    it('повертає PRIVAT коли бачить "Тел.: 3700"', async () => {
      pdfParse.mockResolvedValue({ text: '…Тел.: 3700…' });
      const bank = await getBankByKvit('ignored.pdf');
      expect(bank).toBe(Const.bankList.PRIVAT);
    });

    it('якщо нічого не знайдено – повертає undefined', async () => {
      pdfParse.mockResolvedValue({ text: 'no bank info' });
      const bank = await getBankByKvit('ignored.pdf');
      expect(bank).toBeUndefined();
    });
  });
});
