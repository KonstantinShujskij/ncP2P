// layers/serialize/__tests__/Proof.serialize.test.js

// Мокаємо модулі до імпорту
jest.mock('@filters/Proof.filters', () => ({ admin: jest.fn() }))
jest.mock('@utils/utils', () => ({ toObjectId: jest.fn(id => `OID(${id})`) }))

const Filter = require('@filters/Proof.filters')
const { toObjectId } = require('@utils/utils')
const {
  create,
  clientNumber,
  clientFile,
  decline,
  approve,
  recheck,
  list
} = require('../Proof.serialize')

describe('Proof.serialize', () => {
  let req, res, next

  beforeEach(() => {
    req = { body: {}, file: {} }
    res = {}
    next = jest.fn()
    // скидаємо всі моки перед кожним тестом
    jest.clearAllMocks()
  })

  it('create: формує invoiceId, kvitFile та kvitNumber', () => {
    req.body = { invoice: 'INV1', kvitNumber: 'K1' }
    req.file = { filename: 'file.png' }
    create(req, res, next)
    expect(toObjectId).toHaveBeenCalledWith('INV1')
    expect(req.body).toEqual({
      invoiceId: 'OID(INV1)',
      kvitFile: 'file.png',
      kvitNumber: 'K1'
    })
    expect(next).toHaveBeenCalled()
  })

  it('clientNumber: формує hash та kvitNumber', () => {
    req.body = { hash: 'H1', kvitNumber: 'K2' }
    clientNumber(req, res, next)
    expect(req.body).toEqual({ hash: 'H1', kvitNumber: 'K2' })
    expect(next).toHaveBeenCalled()
  })

  it('clientFile: формує hash та kvitFile', () => {
    req.body = { hash: 'H2' }
    req.file = { filename: 'img.jpg' }
    clientFile(req, res, next)
    expect(req.body).toEqual({ hash: 'H2', kvitFile: 'img.jpg' })
    expect(next).toHaveBeenCalled()
  })

  it('decline: конвертує id через toObjectId', () => {
    req.body = { id: '123' }
    decline(req, res, next)
    expect(toObjectId).toHaveBeenCalledWith('123')
    expect(req.body).toEqual({ id: 'OID(123)' })
    expect(next).toHaveBeenCalled()
  })

  it('approve: формує id, kvitNumber та amount', () => {
    req.body = { id: '456', kvitNumber: 'K3', amount: 300 }
    approve(req, res, next)
    expect(toObjectId).toHaveBeenCalledWith('456')
    expect(req.body).toEqual({ id: 'OID(456)', kvitNumber: 'K3', amount: 300 })
    expect(next).toHaveBeenCalled()
  })

  it('recheck: формує id, bank та number у верхньому регістрі', () => {
    req.body = { id: '789', bank: 'B1', number: 'abc' }
    recheck(req, res, next)
    expect(toObjectId).toHaveBeenCalledWith('789')
    expect(req.body).toEqual({ id: 'OID(789)', bank: 'B1', number: 'ABC' })
    expect(next).toHaveBeenCalled()
  })

  it('list: застосовує Filter.admin і передає page та limit', () => {
    const fake = { f: 1 }
    Filter.admin.mockReturnValue(fake)
    req.body = { filter: { x: 2 }, page: 3, limit: 10 }
    list(req, res, next)
    expect(Filter.admin).toHaveBeenCalledWith({ x: 2 })
    expect(req.body).toEqual({ filter: fake, page: 3, limit: 10 })
    expect(next).toHaveBeenCalled()
  })
})
