// layers/serialize/__tests__/Invoice.serialize.test.js
const { Types } = require('mongoose')
const Filter = require('@filters/Invoice.filters')

// Мокаємо утиліту до отримання імпорту
jest.mock('@utils/utils', () => ({
  toObjectId: jest.fn((id) => `OID(${id})`)
}))
const { toObjectId } = require('@utils/utils')

const { create, get, pay, list } = require('../Invoice.serialize')

describe('Invoice.serialize', () => {
  let req, res, next

  beforeEach(() => {
    req = { body: {} }
    res = {}
    next = jest.fn()
    // робимо мок функції admin
    Filter.admin = jest.fn()
    // доObjectId вже мокована через jest.mock
    toObjectId.mockClear()
  })

  it('create: формує req.body з правильними полями', () => {
    req.body = { amount: 100, refId: 'R', partnerId: 'P', bank: 'B', client: 'C' }
    create(req, res, next)
    expect(req.body).toEqual({
      amount: 100,
      refId: 'R',
      partnerId: 'P',
      bank: 'B',
      client: 'C'
    })
    expect(next).toHaveBeenCalled()
  })

  it('get: конвертує id через toObjectId', async () => {
    req.body = { id: '123' }
    await get(req, res, next)
    expect(toObjectId).toHaveBeenCalledWith('123')
    expect(req.body).toEqual({ id: 'OID(123)' })
    expect(next).toHaveBeenCalled()
  })

  it('pay: переклад hash у новий body', async () => {
    req.body = { hash: 'H1' }
    await pay(req, res, next)
    expect(req.body).toEqual({ hash: 'H1' })
    expect(next).toHaveBeenCalled()
  })

  it('list: застосовує Filter.admin і передає page та limit', () => {
    const fakeFilter = { foo: 'bar' }
    Filter.admin.mockReturnValue(fakeFilter)
    req.body = { filter: { a: 1 }, page: 2, limit: 50 }
    list(req, res, next)
    expect(Filter.admin).toHaveBeenCalledWith({ a: 1 })
    expect(req.body).toEqual({
      filter: fakeFilter,
      page: 2,
      limit: 50
    })
    expect(next).toHaveBeenCalled()
  })
})
