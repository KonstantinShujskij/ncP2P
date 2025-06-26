// layers/models/__tests__/Partner.model.test.js
const mongoose = require('mongoose')
const Partner = require('../Partner.model')

describe('Partner.model', () => {
  it('має коректну назву моделі', () => {
    expect(Partner.modelName).toBe('Partner')
  })

  it('містить поля name, accessToken, privateToken, callbackUrl та whiteList', () => {
    const paths = Object.keys(Partner.schema.paths)
    expect(paths).toEqual(
      expect.arrayContaining([
        '_id',
        'name',
        'accessToken',
        'privateToken',
        'callbackUrl',
        'whiteList',
        '__v',
      ])
    )
  })

  it('тип поля name — String', () => {
    expect(Partner.schema.paths.name.instance).toBe('String')
  })

  it('тип поля accessToken — String', () => {
    expect(Partner.schema.paths.accessToken.instance).toBe('String')
  })

  it('тип поля privateToken — String', () => {
    expect(Partner.schema.paths.privateToken.instance).toBe('String')
  })

  it('тип поля callbackUrl — String', () => {
    expect(Partner.schema.paths.callbackUrl.instance).toBe('String')
  })

  it('whiteList задекларовано як масив', () => {
    const whiteListSchema = Partner.schema.paths.whiteList
    expect(whiteListSchema).toBeDefined()
    expect(whiteListSchema.instance).toBe('Array')
  })
})
