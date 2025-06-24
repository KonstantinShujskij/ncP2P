// layers/validate/__tests__/User.validate.test.js
const { create, login } = require('../User.validate')

describe('User.validate', () => {
  it('create: масив з 3 перевірок на login, password, telegram', () => {
    expect(Array.isArray(create)).toBe(true)
    expect(create).toHaveLength(3)
    const fields = create.map(chain => chain.builder.fields[0])
    expect(fields).toEqual(['login', 'password', 'telegram'])
  })

  it('login: масив з 2 перевірок на login та password', () => {
    expect(Array.isArray(login)).toBe(true)
    expect(login).toHaveLength(2)
    const fields = login.map(chain => chain.builder.fields[0])
    expect(fields).toEqual(['login', 'password'])
  })
})
