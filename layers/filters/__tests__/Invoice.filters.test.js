const { Types } = require('mongoose')
const { admin } = require('../Invoice.filters')

describe('layers/filters/Invoice.filters.admin', () => {
  it('повертає $or з refId та partnerId, якщо id не ObjectId', () => {
    const filter = { id: 'not-object-id' }
    const result = admin(filter)
    expect(result).toEqual({
      $or: [
        { refId: 'not-object-id' },
        { partnerId: 'not-object-id' },
      ],
    })
  })

  it('додає _id у $or, якщо id валідний ObjectId', () => {
    const validId = new Types.ObjectId().toString()
    const result = admin({ id: validId })
    expect(result).toHaveProperty('$or')
    expect(result.$or).toEqual(
      expect.arrayContaining([
        { refId: validId },
        { partnerId: validId },
        { _id: validId },
      ]),
    )
  })

  it('фільтрує за refId та partnerId окремо', () => {
    const filter = { refId: 'R123', partnerId: 'P456' }
    const result = admin(filter)
    expect(result).toMatchObject({
      refId: 'R123',
      partnerId: 'P456',
    })
  })

  it('фільтрує за status', () => {
    const result = admin({ status: 'PAID' })
    expect(result).toMatchObject({ status: 'PAID' })
  })

  it('фільтрує за діапазоном amount.min та amount.max', () => {
    const result = admin({ amount: { min: 10, max: 20 } })
    expect(result).toMatchObject({
      amount: { $gt: 10, $lt: 20 },
    })
  })
})
