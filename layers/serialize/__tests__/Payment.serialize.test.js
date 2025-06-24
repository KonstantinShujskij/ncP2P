// layers/serialize/__tests__/Payment.serialize.test.js
const Filter = require('@filter/Payment.filters')
const { create, block, get, list } = require('../Payment.serialize')

jest.mock('@filter/Payment.filters', () => ({
  admin: jest.fn()
}))

describe('Payment.serialize', () => {
  let req, res, next

  beforeEach(() => {
    req = { body: {} }
    res = {}
    next = jest.fn()
    // забезпечуємо, що admin — мок-функція
    Filter.admin = jest.fn()
  })

  it('create: формує req.body з card, amount, refId, partnerId, course', () => {
    req.body = { card: 'C1', amount: 200, refId: 'R1', partnerId: 'P1', course: 3 }
    create(req, res, next)
    expect(req.body).toEqual({
      card: 'C1',
      amount: 200,
      refId: 'R1',
      partnerId: 'P1',
      course: 3
    })
    expect(next).toHaveBeenCalled()
  })

  it('create: дефолт для refId та course', () => {
    req.body = { card: 'C2', amount: 500, partnerId: 'P2' }
    create(req, res, next)
    expect(req.body).toEqual({
      card: 'C2',
      amount: 500,
      refId: '',
      partnerId: 'P2',
      course: 0
    })
    expect(next).toHaveBeenCalled()
  })

  it('block: формує req.body тільки з card', () => {
    req.body = { card: 'C3', extra: 'x' }
    block(req, res, next)
    expect(req.body).toEqual({ card: 'C3' })
    expect(next).toHaveBeenCalled()
  })

  it('get: формує req.body з id', () => {
    req.body = { id: 'ID1', other: 'y' }
    get(req, res, next)
    expect(req.body).toEqual({ id: 'ID1' })
    expect(next).toHaveBeenCalled()
  })

  it('list: застосовує Filter.admin і передає page та limit', () => {
    const fake = { foo: 'bar' }
    Filter.admin.mockReturnValue(fake)
    req.body = { filter: { a: 1 }, page: 5, limit: 25 }
    list(req, res, next)
    expect(Filter.admin).toHaveBeenCalledWith({ a: 1 })
    expect(req.body).toEqual({
      filter: fake,
      page: 5,
      limit: 25
    })
    expect(next).toHaveBeenCalled()
  })
})
