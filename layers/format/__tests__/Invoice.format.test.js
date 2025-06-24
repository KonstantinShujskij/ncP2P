// layers/format/__tests__/Invoice.format.test.js
const InvoiceFormat = require('../Invoice.format')

describe('layers/format/Invoice.format', () => {
  const sample = {
    _id: '507f1f77bcf86cd799439011',
    refId: 'REF123',
    partnerId: 'P456',
    amount: 1000,
    initialAmount: 800,
    status: 'PAID',
    card: 'VISA',
    client: 'ClientA',
    confirm: true,
    conv: 'ConvX',
    validOk: false,
    payment: 'Pay123',
    kvitFile: 'file.pdf',
    kvitNumber: 'K-789',
    payLink: 'https://pay.link',
    createdAt: '2025-06-01T12:00:00Z',
    extraField: 'ignore-me',
  }

  it('all: повертає те ж, що отримав', () => {
    expect(InvoiceFormat.all(sample)).toBe(sample)
  })

  it('parnter: мапить тільки публічні поля партнера', () => {
    const dto = InvoiceFormat.parnter(sample)
    expect(dto).toEqual({
      id: sample._id,
      refId: sample.refId,
      amount: sample.amount,
      status: sample.status,
      card: sample.card,
      kvit: sample.kvitFile,
      kvitNumber: sample.kvitNumber,
      createdAt: sample.createdAt,
    })
    expect(dto).not.toHaveProperty('partnerId')
    expect(dto).not.toHaveProperty('client')
  })

  it('client: мапить тільки публічні поля клієнта', () => {
    const dto = InvoiceFormat.client(sample)
    expect(dto).toEqual({
      id: sample._id,
      refId: sample.refId,
      partnerId: sample.partnerId,
      amount: sample.amount,
      initialAmount: sample.initialAmount,
      status: sample.status,
      card: sample.card,
      createdAt: sample.createdAt,
    })
    expect(dto).not.toHaveProperty('client')
    expect(dto).not.toHaveProperty('validOk')
  })

  it('admin: мапить повний набір полів для адміністратора', () => {
    const dto = InvoiceFormat.admin(sample)
    expect(dto).toEqual({
      id: sample._id,
      refId: sample.refId,
      amount: sample.amount,
      initialAmount: sample.initialAmount,
      client: sample.client,
      confirm: sample.confirm,
      conv: sample.conv,
      status: sample.status,
      validOk: sample.validOk,
      card: sample.card,
      payment: sample.payment,
      kvit: sample.kvitFile,
      kvitNumber: sample.kvitNumber,
      payLink: sample.payLink,
      createdAt: sample.createdAt,
    })
    expect(dto).not.toHaveProperty('extraField')
  })
})
