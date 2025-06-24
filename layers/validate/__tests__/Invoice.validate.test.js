// layers/validate/__tests__/Invoice.validate.test.js
const { create, pay, get, list } = require('../Invoice.validate')

// Тестуємо тільки структуру ланцюжків та поля, методи express-validator не інспектуються

describe('Invoice.validate', () => {
  it('create: масив з 5 перевірок на правильні поля', () => {
    expect(Array.isArray(create)).toBe(true)
    expect(create).toHaveLength(5)
    const fields = create.map(chain => chain.builder.fields[0])
    expect(fields).toEqual([
      'amount',
      'refId',
      'partnerfId',
      'bank',
      'client',
    ])
  })

  it('pay: масив з 1 перевірки на hash', () => {
    expect(Array.isArray(pay)).toBe(true)
    expect(pay).toHaveLength(1)
    expect(pay[0].builder.fields).toEqual(['hash'])
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
