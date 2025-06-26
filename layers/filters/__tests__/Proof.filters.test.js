// layers/filters/__tests__/Proof.filters.test.js
const { Types } = require('mongoose')
const { admin } = require('../Proof.filters')

describe('layers/filters/Proof.filters.admin', () => {
  it('фільтрує лише за _id, якщо передано id', () => {
    const filter = { id: '123' }
    const result = admin(filter)
    expect(result).toEqual({ _id: '123' })
  })

  it('фільтрує за status', () => {
    const result = admin({ status: 'APPROVED' })
    expect(result).toEqual({ status: 'APPROVED' })
  })

  describe('фільтрація за invoice', () => {
    it('повертає $or з invoiceRefId та invoicePartnerId, якщо invoice не ObjectId', () => {
      const result = admin({ invoice: 'INV-1' })
      expect(result).toEqual({
        $or: [
          { invoiceRefId: 'INV-1' },
          { invoicePartnerId: 'INV-1' },
        ],
      })
    })

    it('додає invoice у $or, якщо invoice валідний ObjectId', () => {
      const oid = new Types.ObjectId().toString()
      const result = admin({ invoice: oid })
      expect(result.$or).toEqual(
        expect.arrayContaining([
          { invoice: oid },
          { invoiceRefId: oid },
          { invoicePartnerId: oid },
        ])
      )
    })
  })

  describe('фільтрація за payment', () => {
    it('повертає $or з paymentRefId та paymentPartnerId, якщо payment не ObjectId', () => {
      const result = admin({ payment: 'PAY-1' })
      expect(result).toEqual({
        $or: [
          { paymentRefId: 'PAY-1' },
          { paymentPartnerId: 'PAY-1' },
        ],
      })
    })

    it('додає payment у $or, якщо payment валідний ObjectId', () => {
      const oid = new Types.ObjectId().toString()
      const result = admin({ payment: oid })
      expect(result.$or).toEqual(
        expect.arrayContaining([
          { payment: oid },
          { paymentRefId: oid },
          { paymentPartnerId: oid },
        ])
      )
    })
  })

  it('фільтрує за bank', () => {
    const result = admin({ bank: 'MyBank' })
    expect(result).toEqual({ bank: 'MyBank' })
  })

  it('фільтрує за kvitNumber (kvit)', () => {
    const result = admin({ kvit: 'KV-999' })
    expect(result).toEqual({ kvitNumber: 'KV-999' })
  })

  it('фільтрує за діапазоном amount.min та amount.max', () => {
    const result = admin({ amount: { min: 50, max: 150 } })
    expect(result).toHaveProperty('amount', { $gt: 50, $lt: 150 })
  })
})
