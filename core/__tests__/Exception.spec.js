// core/__tests__/Exception.spec.js

const Exception = require('../Exception');

describe('core/Exception', () => {
  it('має експорт всіх очікуваних визначень помилок', () => {
    expect(Exception).toEqual({
      invalidCard:          { status: 415, msg: 'Incorrect Card Number' },
      invalidAmount:        { status: 415, msg: 'Incorrect Amount' },
      invalidRefId:         { status: 415, msg: 'Incorrect Reference Id' },
      invalidPartnerId:     { status: 415, msg: 'Incorrect Partner Id' },
      invalidBank:          { status: 415, msg: 'Incorrect Bank' },

      manyProofs:           { status: 415, msg: 'So many proofs. Please wait' },

      isExist:              { status: 409, msg: 'Already Exists' },
      notFind:              { status: 404, msg: "Can't Find" },
      cantCloseInvoice:     { status: 409, msg: 'Cant Close Final Invoice' },
      cantRefreshPayment:   { status: 409, msg: 'Cant Reject Final Payment' },
      cantPushTail:         { status: 409, msg: 'This payment have avtiv invoices or waiting for tail' },

      cardBlocked:          { status: 409, msg: 'Card is Blocked' },
      clientHasActive:      { status: 409, msg: 'Client has Active' },

      notAuth:              { status: 401, msg: 'Bad Auth' },
      notAccess:            { status: 401, msg: 'Not Access' },

      invalidId:            { status: 415, msg: 'Invalid Id' },
      invalidValue:         { status: 415, msg: 'Unsupported Data Type' },

      invalidEmail:         { status: 415, msg: 'Incorrect Email' },
      invalidPass:          { status: 415, msg: 'Incorrect Password' },

      notCanSaveModel:      { status: 500, msg: 'Internal Server Error' },
      unknown:              { status: 520, msg: 'Something went wrong...' }
    });
  });

  it('кожне визначення помилки має числовий status та рядковий msg', () => {
    for (const [key, def] of Object.entries(Exception)) {
      expect(typeof def.status).toBe('number');
      expect(typeof def.msg).toBe('string');
    }
  });
});
