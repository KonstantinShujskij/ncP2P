// layers/models/__tests__/User.model.test.js
const mongoose = require('mongoose')
const User = require('../User.model')
const Const = require('@core/Const')

describe('User.model', () => {
  it('має коректну назву моделі', () => {
    expect(User.modelName).toBe('User')
  })

  it('містить усі очікувані шляхи', () => {
    const paths = Object.keys(User.schema.paths)
    expect(paths).toEqual(
      expect.arrayContaining([
        '_id',
        'login',
        'password',
        'telegram',
        'access',
        'accessId',
        'twoFA',
        '__v',
      ])
    )
  })

  it('login, password, telegram — String без дефолту', () => {
    ['login', 'password', 'telegram'].forEach(field => {
      const p = User.schema.paths[field]
      expect(p.instance).toBe('String')
      expect(p.options.default).toBeUndefined()
    })
  })

  it('access — String з дефолтом SUPPORT', () => {
    const p = User.schema.paths.access
    expect(p.instance).toBe('String')
    expect(p.options.default).toBe(Const.userAccess.SUPPORT)
  })

  it('accessId — ObjectId з ref Partner', () => {
    const p = User.schema.paths.accessId
    expect(p.instance).toBe('ObjectId')
    expect(p.options.ref).toBe('Partner')
  })

  it('twoFA — String з дефолтом ""', () => {
    const p = User.schema.paths.twoFA
    expect(p.instance).toBe('String')
    expect(p.options.default).toBe('')
  })
})
