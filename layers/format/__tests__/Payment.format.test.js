// layers/format/__tests__/Payment.format.test.js
const PaymentFormat = require('../Payment.format')

describe('layers/format/Payment.format', () => {
  const sample = {
    _id: '507f1f77bcf86cd799439011',
    refId: 'REF123',
    partnerId: 'P456',
    card: 'MASTER',
    amount: 1200,
    initialAmount: 1000,
    currentAmount: 800,
    status: 'COMPLETED',
    isFreeze: true,
    isTail: false,
    isOneWait: true,
    isOneValid: false,
    isAllValidOk: true,
    priority: 5,
    createdAt: '2025-06-01T12:00:00Z',
    extraField: 'ignore-me'
  }

  it('all: повертає оригінальний обʼєкт', () => {
    expect(PaymentFormat.all(sample)).toBe(sample)
  })

  it('parnter: мапить лише публічні поля партнера', () => {
    const dto = PaymentFormat.parnter(sample)
    expect(dto).toEqual({
      id: sample._id,
      refId: sample.refId,
      partnerId: sample.partnerId,
      card: sample.card,
      amount: sample.amount,
      status: sample.status,
      createdAt: sample.createdAt
    })
    expect(dto).not.toHaveProperty('initialAmount')
    expect(dto).not.toHaveProperty('isFreeze')
  })

  it('admin: мапить повний набір полів для адміністратора', () => {
    const dto = PaymentFormat.admin(sample)
    expect(dto).toEqual({
      id: sample._id,
      refId: sample.refId,
      partnerId: sample.partnerId,
      isFreeze: sample.isFreeze,
      isTail: sample.isTail,
      card: sample.card,
      amount: sample.amount,
      initialAmount: sample.initialAmount,
      currentAmount: sample.currentAmount,
      status: sample.status,
      isOneWait: sample.isOneWait,
      isOneValid: sample.isOneValid,
      isAllValidOk: sample.isAllValidOk,
      priority: sample.priority,
      createdAt: sample.createdAt
    })
    expect(dto).not.toHaveProperty('extraField')
  })
})
