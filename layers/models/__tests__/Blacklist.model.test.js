// layers/models/__tests__/Blacklist.model.test.js
const mongoose = require('mongoose')
const Blacklist = require('../BlackList.model')

describe('Blacklist.model', () => {
  it('має коректну назву моделі та колекції', () => {
    expect(Blacklist.modelName).toBe('Blacklist')
  })

  it('містить поля refId, card, isActive, createdAt та updatedAt', () => {
    const paths = Object.keys(Blacklist.schema.paths)
    expect(paths).toEqual(
      expect.arrayContaining([
        '_id',
        'refId',
        'card',
        'isActive',
        'createdAt',
        'updatedAt',
        '__v',
      ])
    )
  })

  it('тип поля refId — String із дефолтом ""', () => {
    const schemaType = Blacklist.schema.paths.refId
    expect(schemaType.instance).toBe('String')
    expect(schemaType.options.default).toBe('')
  })

  it('тип поля card — String', () => {
    expect(Blacklist.schema.paths.card.instance).toBe('String')
  })

  it('тип поля isActive — Boolean із дефолтом true', () => {
    const schemaType = Blacklist.schema.paths.isActive
    expect(schemaType.instance).toBe('Boolean')
    expect(schemaType.options.default).toBe(true)
  })

  it('тип поля createdAt та updatedAt — Number (timestamps)', () => {
    expect(Blacklist.schema.paths.createdAt.instance).toBe('Number')
    expect(Blacklist.schema.paths.updatedAt.instance).toBe('Number')
  })
})
