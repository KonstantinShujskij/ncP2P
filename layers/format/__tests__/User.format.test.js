// layers/format/__tests__/User.format.test.js
const UserFormat = require('../User.format')

describe('layers/format/User.format', () => {
  const sample = {
    _id: '507f1f77bcf86cd799439011',
    login: 'user123',
    telegram: '@user_telegram',
    extraField: 'ignore-me'
  }

  it('all: повертає оригінальний обʼєкт', () => {
    expect(UserFormat.all(sample)).toBe(sample)
  })

  it('admin: мапить тільки id, login і telegram', () => {
    const dto = UserFormat.admin(sample)
    expect(dto).toEqual({
      id: sample._id,
      login: sample.login,
      telegram: sample.telegram
    })
    expect(dto).not.toHaveProperty('extraField')
  })
})
