// layers/models/__tests__/Invoice.model.test.js
const mongoose = require('mongoose')
const Invoice = require('../Invoice.model')
const Const = require('../../../core/Const')

describe('Invoice.model', () => {
  it('має коректну назву моделі та колекції', () => {
    expect(Invoice.modelName).toBe('Invoice')
  })

  it('містить усі очікувані шляхи', () => {
    const paths = Object.keys(Invoice.schema.paths)
    expect(paths).toEqual(
      expect.arrayContaining([
        '_id',
        'paymentAccessId',
        'refId',
        'partnerId',
        'initialAmount',
        'availableAmount',
        'amount',
        'status',
        'validOk',
        'payment',
        'paymentRefId',
        'paymentPartnerId',
        'card',
        'bank',
        'client',
        'conv',
        'confirm',
        'kvitNumber',
        'kvitFile',
        'payLink',
        'createdAt',
        'updatedAt',
        '__v',
      ])
    )
  })

  it('paymentAccessId і payment мають тип ObjectId та правильний ref', () => {
    const acc = Invoice.schema.paths.paymentAccessId
    expect(acc.instance).toBe('ObjectId')
    expect(acc.options.ref).toBe('Partner')

    const pay = Invoice.schema.paths.payment
    expect(pay.instance).toBe('ObjectId')
    expect(pay.options.ref).toBe('Payment')
  })

  it('refId і partnerId — String з дефолтом ""', () => {
    const r = Invoice.schema.paths.refId
    const p = Invoice.schema.paths.partnerId
    expect(r.instance).toBe('String')
    expect(r.options.default).toBe('')
    expect(p.instance).toBe('String')
    expect(p.options.default).toBe('')
  })

  it('initialAmount, availableAmount, amount — Number', () => {
    ['initialAmount', 'availableAmount', 'amount'].forEach(field => {
      expect(Invoice.schema.paths[field].instance).toBe('Number')
    })
  })

  it('status — String з дефолтом WAIT', () => {
    const status = Invoice.schema.paths.status
    expect(status.instance).toBe('String')
    expect(status.options.default).toBe(Const.invoice.statusList.WAIT)
  })

  it('validOk — Boolean з дефолтом false', () => {
    const v = Invoice.schema.paths.validOk
    expect(v.instance).toBe('Boolean')
    expect(v.options.default).toBe(false)
  })

  it('paymentRefId і paymentPartnerId — String з дефолтом null', () => {
    ['paymentRefId', 'paymentPartnerId'].forEach(field => {
      const p = Invoice.schema.paths[field]
      expect(p.instance).toBe('String')
      expect(p.options.default).toBeNull()
    })
  })

  it('card, bank, client — String (bank та client можуть бути null)', () => {
    const card = Invoice.schema.paths.card
    const bank = Invoice.schema.paths.bank
    const client = Invoice.schema.paths.client

    expect(card.instance).toBe('String')
    expect(bank.instance).toBe('String')
    expect(bank.options.default).toBeNull()
    expect(client.instance).toBe('String')
    expect(client.options.default).toBeNull()
  })

  it('conv і confirm — Number з дефолтом -1', () => {
    ['conv', 'confirm'].forEach(field => {
      const p = Invoice.schema.paths[field]
      expect(p.instance).toBe('Number')
      expect(p.options.default).toBe(-1)
    })
  })

  it('kvitNumber, kvitFile, payLink — String з дефолтом null', () => {
    ['kvitNumber', 'kvitFile', 'payLink'].forEach(field => {
      const p = Invoice.schema.paths[field]
      expect(p.instance).toBe('String')
      expect(p.options.default).toBeNull()
    })
  })

  it('createdAt та updatedAt — Number (timestamps)', () => {
    expect(Invoice.schema.paths.createdAt.instance).toBe('Number')
    expect(Invoice.schema.paths.updatedAt.instance).toBe('Number')
  })
})
