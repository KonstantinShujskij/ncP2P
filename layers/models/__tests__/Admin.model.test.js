// layers/models/__tests__/Admin.model.test.js
const mongoose = require('mongoose')
const Admin = require('../Admin.model')

describe('Admin.model', () => {
  it('має коректну назву колекції та модель', () => {
    expect(Admin.modelName).toBe('Admin')
  })

  it('містить поля name, accessToken, privateToken, callbackUrl та whiteList', () => {
    const paths = Object.keys(Admin.schema.paths)

    // _id та __v додаються автоматично
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
    const nameType = Admin.schema.paths.name.instance
    expect(nameType).toBe('String')
  })

  it('тип поля accessToken — String', () => {
    expect(Admin.schema.paths.accessToken.instance).toBe('String')
  })

  it('тип поля privateToken — String', () => {
    expect(Admin.schema.paths.privateToken.instance).toBe('String')
  })

  it('тип поля callbackUrl — String', () => {
    expect(Admin.schema.paths.callbackUrl.instance).toBe('String')
  })

  it('whiteList задекларовано як масив', () => {
    // В Mongoose масив без вказаного типу — це Mixed[]
    const whiteListSchema = Admin.schema.paths.whiteList
    expect(whiteListSchema).toBeDefined()
    expect(whiteListSchema.instance).toBe('Array')
  })
})
