// layers/format/__tests__/Proof.format.test.js
const ProofFormat = require('../Proof.format')

describe('layers/format/Proof.format', () => {
  const sample = {
    _id: '507f1f77bcf86cd799439011',
    invoice: 'INV123',
    status: 'VALID',
    payment: 'PAY456',
    gpt: 'GPT789',
    invoiceSubstatus: 'SUB1',
    client: 'ClientA',
    confirm: true,
    conv: 'ConvX',
    bank: 'BankZ',
    amount: 300,
    invoiceAmount: 1000,
    invoiceCard: 'VISA',
    invoiceDate: '2025-06-15',
    kvitNumber: 'K-001',
    kvitFile: 'file.pdf',
    fileLink: 'https://files.link',
    lastCheck: '2025-06-20T10:00:00Z',
    isChecking: false,
    createdAt: '2025-06-01T12:00:00Z',
    extraField: 'ignore-me'
  }

  it('all: повертає оригінальний обʼєкт', () => {
    expect(ProofFormat.all(sample)).toBe(sample)
  })

  it('admin: мапить повний набір полів для адміністратора', () => {
    const dto = ProofFormat.admin(sample)
    expect(dto).toEqual({
      id: sample._id,
      invoice: sample.invoice,
      status: sample.status,
      payment: sample.payment,
      gpt: sample.gpt,
      invoiceSubstatus: sample.invoiceSubstatus,
      client: sample.client,
      confirm: sample.confirm,
      conv: sample.conv,
      bank: sample.bank,
      amount: sample.amount,
      invoiceAmount: sample.invoiceAmount,
      invoiceCard: sample.invoiceCard,
      invoiceDate: sample.invoiceDate,
      kvitNumber: sample.kvitNumber,
      kvitFile: sample.kvitFile,
      fileLink: sample.fileLink,
      lastCheck: sample.lastCheck,
      isChecking: sample.isChecking,
      createdAt: sample.createdAt,
    })
    expect(dto).not.toHaveProperty('extraField')
  })

  it('partner: мапить лише публічні поля партнера', () => {
    const dto = ProofFormat.partner(sample)
    expect(dto).toEqual({
      id: sample._id,
      invoice: sample.invoice,
      status: sample.status,
      bank: sample.bank,
      amount: sample.amount,
      kvitNumber: sample.kvitNumber,
      kvitFile: sample.kvitFile,
      createdAt: sample.createdAt,
    })
    expect(dto).not.toHaveProperty('client')
    expect(dto).not.toHaveProperty('payment')
  })

  it('client: мапить лише публічні поля клієнта', () => {
    const dto = ProofFormat.client(sample)
    expect(dto).toEqual({
      id: sample._id,
      invoice: sample.invoice,
      status: sample.status,
      bank: sample.bank,
      amount: sample.amount,
      kvitNumber: sample.kvitNumber,
      kvitFile: sample.kvitFile,
      createdAt: sample.createdAt,
    })
    expect(dto).not.toHaveProperty('confirm')
    expect(dto).not.toHaveProperty('gpt')
  })
})
