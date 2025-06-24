// utils/__tests__/telegram.utils.spec.js

// Мокаємо зовнішні залежності перед імпортом модуля
jest.mock('config', () => ({
  get: jest.fn(key => {
    switch (key) {
      case 'botToken':    return 'BOT_TOKEN';
      case 'authSecret':  return 'SECRET';
      case 'adminGroupe': return 'ADMIN_CHAT';
      default:            return '';
    }
  })
}));
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn()
}));
jest.mock('https');
jest.mock('@core/Exception', () => ({
  notAuth:   { status: 401, msg: 'Bad Auth' },
  unknown:   { status: 520, msg: 'Something went wrong...' }
}));

const config    = require('config');
const jwt       = require('jsonwebtoken');
const https     = require('https');
const Exception = require('@core/Exception');

// Імпортуємо реальний модуль
const {
  sendMessage,
  sendAuth,
  sendCode,
  verify,
  cantNcApiMake,
  clientHasActive,
  cantSendCallback,
  moreAmount,
  sendProofs
} = require('../telegram.utils');

describe('utils/telegram.utils (real module)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendMessage()', () => {
    it('повертає true при успішному https.get', () => {
      https.get.mockImplementation(() => {});
      expect(sendMessage('CHAT1', 'Hello')).toBe(true);
      expect(https.get).toHaveBeenCalledWith(
        'https://api.telegram.org/botBOT_TOKEN/sendMessage?chat_id=CHAT1&text=Hello&parse_mode=html'
      );
    });

    it('повертає false при помилці https.get', () => {
      https.get.mockImplementation(() => { throw new Error(); });
      expect(sendMessage('CHAT2', 'Bye')).toBe(false);
    });
  });

  describe('sendAuth()', () => {
    it('відправляє accessToken і privateToken через sendMessage', () => {
      https.get.mockImplementation(() => {});
      const auth = { accessToken: 'A1', privateToken: 'P1' };
      expect(sendAuth('CHATX', auth)).toBe(true);
      expect(https.get).toHaveBeenCalledWith(
        'https://api.telegram.org/botBOT_TOKEN/sendMessage?' +
        'chat_id=CHATX&text=' +
        'Access Token: <code>A1</code>%0APrivate Token: <code>P1</code>' +
        '&parse_mode=html'
      );
    });
  });

  describe('sendCode()', () => {
    it('генерує код, відправляє його і повертає підписаний токен', () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.5);
      jwt.sign.mockReturnValue('JWT_TOKEN');
      https.get.mockImplementation(() => {});

      const code = 100000 + parseInt(0.5 * 900000);
      const token = sendCode('CHATY');

      expect(https.get).toHaveBeenCalledWith(
        `https://api.telegram.org/botBOT_TOKEN/sendMessage?` +
        `chat_id=CHATY&text=<code>${code}</code>&parse_mode=html`
      );
      expect(jwt.sign).toHaveBeenCalledWith(
        { telegram: 'CHATY', code },
        'SECRET',
        { expiresIn: '5m' }
      );
      expect(token).toBe('JWT_TOKEN');
    });
  });

  describe('verify()', () => {
    it('не кидає при валідному токені', () => {
      jwt.verify.mockReturnValue({ telegram: 'T1', code: '123' });
      expect(() => verify('TOK', 'T1', '123')).not.toThrow();
      expect(jwt.verify).toHaveBeenCalledWith('TOK', 'SECRET');
    });

    it('кидає Exception.notAuth при невірному коді', () => {
      jwt.verify.mockReturnValue({ telegram: 'T1', code: '999' });
      try {
        verify('TOK', 'T1', '123');
        throw new Error('Expected verify to throw Exception.notAuth');
      } catch (err) {
        expect(err).toBe(Exception.notAuth);
      }
    });

    it('кидає Exception.notAuth при невірному telegram', () => {
      jwt.verify.mockReturnValue({ telegram: 'X1', code: '123' });
      try {
        verify('TOK', 'T1', '123');
        throw new Error('Expected verify to throw Exception.notAuth');
      } catch (err) {
        expect(err).toBe(Exception.notAuth);
      }
    });
  });

  describe('notification helpers', () => {
    beforeEach(() => {
      https.get.mockImplementation(() => {});
    });

    it('cantNcApiMake() відправляє повідомлення адміну', () => {
      cantNcApiMake('PAY123');
      expect(https.get).toHaveBeenCalledWith(
        expect.stringContaining('chat_id=ADMIN_CHAT'),
      );
    });

    it('clientHasActive() формує повідомлення з деталями invoice', () => {
      const inv = { _id: 'ID1', client: 'CL1', amount: 200 };
      clientHasActive(inv);
      const url = https.get.mock.calls[0][0];
      expect(url).toContain(`<code>${inv._id}</code>`);
      expect(url).toContain(`<code>${inv.amount}</code>`);
    });

    it('cantSendCallback() відправляє повідомлення адміну', () => {
      cantSendCallback('INV2');
      expect(https.get).toHaveBeenCalledWith(
        expect.stringContaining('Cant send payment callback to NcPay. id: INV2'),
      );
    });

    it('moreAmount() відправляє повідомлення з сумою та ID', () => {
      moreAmount({ _id: 'ID3', amount: 300 }, 150);
      expect(https.get).toHaveBeenCalledWith(
        expect.stringContaining('will be closed - 150'),
      );
    });

    it('sendProofs() відправляє повідомлення для кожного proof', () => {
      const proofs = [
        { payment: 'P1', invoice: 'I1', proof: 'X1', link: 'L1' },
        { payment: 'P2', invoice: 'I2', proof: 'X2', link: 'L2' }
      ];
      sendProofs(proofs, 'CHATZ');
      expect(https.get).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining(`<code>${proofs[0].payment}</code>`),
      );
      expect(https.get).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining(`<code>${proofs[1].invoice}</code>`),
      );
    });
  });
});
