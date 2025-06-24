// layers/filters/__tests__/Payment.filters.test.js
const { Types } = require('mongoose')
const { admin } = require('../Payment.filters')

describe('layers/filters/Payment.filters.admin', () => {
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

  it('фільтрує лише за refId та partnerId без id', () => {
    const result = admin({ refId: 'R1', partnerId: 'P2' })
    expect(result).toMatchObject({
      refId: 'R1',
      partnerId: 'P2',
    })
  })

  it('фільтрує за status', () => {
    const result = admin({ status: 'PENDING' })
    expect(result).toMatchObject({ status: 'PENDING' })
  })

  it('фільтрує за card', () => {
    const result = admin({ card: 'CARD123' })
    expect(result).toMatchObject({ card: 'CARD123' })
  })

  it('фільтрує за діапазоном amount.min та amount.max', () => {
    const result = admin({ amount: { min: 10, max: 50 } })
    expect(result).toHaveProperty('amount', { $gt: 10, $lt: 50 })
  })

  it('фільтрує за діапазоном initialAmount.min та initialAmount.max', () => {
    const result = admin({ initialAmount: { min: 5, max: 15 } })
    expect(result).toHaveProperty('initialAmount', { $gt: 5, $lt: 15 })
  })

  it('фільтрує за діапазоном currentAmount.min та currentAmount.max', () => {
    const result = admin({ currentAmount: { min: 100, max: 200 } })
    expect(result).toHaveProperty('currentAmount', { $gt: 100, $lt: 200 })
  })

  it('комбінує декілька умов одночасно', () => {
    const validId = new Types.ObjectId().toString()
    const result = admin({
      id: validId,
      status: 'COMPLETED',
      amount: { min: 20 },
      currentAmount: { max: 500 },
      card: 'X1Y2Z3',
    })
    expect(result).toHaveProperty('$or')
    expect(result.status).toBe('COMPLETED')
    expect(result.card).toBe('X1Y2Z3')
    expect(result.amount).toEqual({ $gt: 20 })
    expect(result.currentAmount).toEqual({ $lt: 500 })
  })
})
