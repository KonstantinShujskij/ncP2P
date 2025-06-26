// layers/models/__tests__/Task.model.test.js
const mongoose = require('mongoose')
const Task = require('../Task.model')

describe('Task.model', () => {
  it('має коректну назву моделі', () => {
    expect(Task.modelName).toBe('Task')
  })

  it('містить усі очікувані шляхи', () => {
    const paths = Object.keys(Task.schema.paths)
    expect(paths).toEqual(
      expect.arrayContaining([
        '_id',
        'timestamp',
        'type',
        'payload',
        '__v',
      ])
    )
  })

  it('поле timestamp — String без дефолту', () => {
    const p = Task.schema.paths.timestamp
    expect(p.instance).toBe('String')
    expect(p.options.default).toBeUndefined()
  })

  it('поле type — String без дефолту', () => {
    const p = Task.schema.paths.type
    expect(p.instance).toBe('String')
    expect(p.options.default).toBeUndefined()
  })

  it('поле payload — Mixed з типом Object без дефолту', () => {
    const p = Task.schema.paths.payload
    // Від Mongoose масив об’єктних схем дає instance "Mixed"
    expect(p.instance).toBe('Mixed')
    expect(p.options.default).toBeUndefined()
  })
})
