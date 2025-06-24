// layers/validate/__tests__/Payment.validate.test.js
const { create, block, get, list } = require('../Payment.validate')

describe('Payment.validate', () => {
  it('create: масив з 5 перевірок на правильні поля', () => {
    expect(Array.isArray(create)).toBe(true)
    expect(create).toHaveLength(5)
    const fields = create.map(chain => chain.builder.fields[0])
    expect(fields).toEqual([
      'card',
      'amount',
      'refId',
      'partnerId',
      'course',
    ])
  })

  it('block: масив з 1 перевірки на card', () => {
    expect(Array.isArray(block)).toBe(true)
    expect(block).toHaveLength(1)
    expect(block[0].builder.fields).toEqual(['card'])
  })

  it('get: масив з 1 перевірки на id', () => {
    expect(Array.isArray(get)).toBe(true)
    expect(get).toHaveLength(1)
    expect(get[0].builder.fields).toEqual(['id'])
  })

  it('list: перевіряє поля filter, page, limit', () => {
    expect(Array.isArray(list)).toBe(true)
    expect(list).toHaveLength(3)
    const fields = list.map(chain => chain.builder.fields[0])
    expect(fields).toEqual(['filter', 'page', 'limit'])
  })
})
