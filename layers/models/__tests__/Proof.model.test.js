// layers/models/__tests__/Proof.model.test.js
const mongoose = require('mongoose')
const Proof = require('../Proof.model')
const Const = require('../../../core/Const')

describe('Proof.model', () => {
  it('має коректну назву моделі', () => {
    expect(Proof.modelName).toBe('Proof')
  })

  it('містить усі очікувані шляхи', () => {
    const paths = Object.keys(Proof.schema.paths)
    expect(paths).toEqual(
      expect.arrayContaining([
        '_id',
        'paymentAccessId',
        'invoice',
        'invoiceRefId',
        'invoicePartnerId',
        'payment',
        'paymentRefId',
        'paymentPartnerId',
        'status',
        'bank',
        'amount',
        'invoiceAmount',
        'invoiceCard',
        'invoiceDate',
        'invoiceSubstatus',
        'client',
        'conv',
        'confirm',
        'kvitNumber',
        'kvitFile',
        'fileLink',
        '__v',
        'lastCheck',
        'isChecking',
        'createdAt',
        'updatedAt',
      ])
    )
  })

  it('ObjectId‐поля мають правильні ref', () => {
    ['paymentAccessId','invoice','payment'].forEach(field => {
      const p = Proof.schema.paths[field]
      expect(p.instance).toBe('ObjectId')
      const expectedRef = field === 'invoice' ? 'Invoice'
        : field === 'payment' ? 'Payment'
        : 'Partner'
      expect(p.options.ref).toBe(expectedRef)
    })
  })

  it('String‐поля з правильними дефолтами', () => {
    const stringDefaults = {
      invoiceRefId: null,
      invoicePartnerId: null,
      paymentRefId: null,
      paymentPartnerId: null,
      bank: '',
      invoiceSubstatus: null,
      client: null,
      kvitNumber: null,
      kvitFile: null,
      fileLink: null
    }
    Object.entries(stringDefaults).forEach(([field, def]) => {
      const p = Proof.schema.paths[field]
      expect(p.instance).toBe('String')
      expect(p.options.default).toBe(def)
    })
  })

  it('числові поля з правильними дефолтами', () => {
    const numberDefaults = {
      amount: 0,
      invoiceAmount: 0,
      invoiceCard: '',
      invoiceDate: 0,
      conv: -1,
      confirm: -1,
      lastCheck: 0
    }
    Object.entries(numberDefaults).forEach(([field, def]) => {
      const p = Proof.schema.paths[field]
      expect(p.instance).toBe('Number')
      expect(p.options.default).toBe(def)
    })
  })

  it('поле gpt — вкладена схема з коректними шляхами та дефолтами', () => {
    const sub = Proof.schema.paths['gpt.number']
    expect(sub.instance).toBe('String')
    expect(sub.options.default).toBeNull()

    const subN = Proof.schema.paths['gpt.amount']
    expect(subN.instance).toBe('Number')
    expect(subN.options.default).toBe(0)

    const subC = Proof.schema.paths['gpt.card']
    expect(subC.instance).toBe('String')
    expect(subC.options.default).toBeNull()

    const subD = Proof.schema.paths['gpt.date']
    expect(subD.instance).toBe('String')
    expect(subD.options.default).toBeNull()
  })

  it('status — String з дефолтом WAIT', () => {
    const p = Proof.schema.paths.status
    expect(p.instance).toBe('String')
    expect(p.options.default).toBe(Const.proof.statusList.WAIT)
  })

  it('isChecking — Boolean з дефолтом false', () => {
    const p = Proof.schema.paths.isChecking
    expect(p.instance).toBe('Boolean')
    expect(p.options.default).toBe(false)
  })
})
