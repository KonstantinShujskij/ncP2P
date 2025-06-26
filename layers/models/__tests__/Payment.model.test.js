// layers/models/__tests__/Payment.model.test.js
const mongoose = require('mongoose')
const Payment = require('../Payment.model')
const Const = require('@core/Const')

describe('Payment.model', () => {
  it('має коректну назву моделі', () => {
    expect(Payment.modelName).toBe('Payment')
  })

  it('містить усі очікувані шляхи', () => {
    const paths = Object.keys(Payment.schema.paths)
    expect(paths).toEqual(
      expect.arrayContaining([
        '_id',
        'author',
        'accessId',
        'refId',
        'partnerId',
        'tailId',
        'card',
        'amount',
        'course',
        'initialAmount',
        'currentAmount',
        'tailAmount',
        'minLimit',
        'maxLimit',
        'status',
        'isOneWait',
        'isOneValid',
        'isAllValidOk',
        'isWait',
        'isRefresh',
        'isTail',
        'isFreeze',
        'priority',
        'createdAt',
        'updatedAt',
        '__v',
      ])
    )
  })

  it('accessId — ObjectId з ref Partner', () => {
    const p = Payment.schema.paths.accessId
    expect(p.instance).toBe('ObjectId')
    expect(p.options.ref).toBe('Partner')
  })

  it('author, refId, partnerId та tailId — String з правильними дефолтами', () => {
    ;[
      ['author', ''],
      ['refId', ''],
      ['partnerId', ''],
      ['tailId', null]
    ].forEach(([field, def]) => {
      const p = Payment.schema.paths[field]
      expect(p.instance).toBe('String')
      expect(p.options.default).toBe(def)
    })
  })

  it('card — String', () => {
    expect(Payment.schema.paths.card.instance).toBe('String')
  })

  it('кількісні поля — Number з правильними дефолтами для course, tailAmount та minLimit', () => {
    ;[
      ['course', 0],
      ['tailAmount', 0],
      ['minLimit', Const.minPaymentLimit]
    ].forEach(([field, def]) => {
      const p = Payment.schema.paths[field]
      expect(p.instance).toBe('Number')
      expect(p.options.default).toBe(def)
    })
  })

  it('amount, initialAmount, currentAmount — Number без дефолту', () => {
    ;['amount', 'initialAmount', 'currentAmount'].forEach(field => {
      const p = Payment.schema.paths[field]
      expect(p.instance).toBe('Number')
      expect(p.options.default).toBeUndefined()
    })
  })

  it('maxLimit — Number без дефолту', () => {
    const p = Payment.schema.paths.maxLimit
    expect(p.instance).toBe('Number')
    expect(p.options.default).toBeUndefined()
  })

  it('status — String з дефолтом ACTIVE', () => {
    const s = Payment.schema.paths.status
    expect(s.instance).toBe('String')
    expect(s.options.default).toBe(Const.payment.statusList.ACTIVE)
  })

  it('boolean поля мають правильні дефолти', () => {
    const boolDefaults = {
      isOneWait: false,
      isOneValid: false,
      isAllValidOk: false,
      isWait: false,
      isRefresh: true,
      isTail: false,
      isFreeze: false,
      priority: false
    }
    Object.entries(boolDefaults).forEach(([field, def]) => {
      const p = Payment.schema.paths[field]
      expect(p.instance).toBe('Boolean')
      expect(p.options.default).toBe(def)
    })
  })
})
