// layers/models/__tests__/Log.model.test.js
const mongoose = require('mongoose')
const Log = require('../Log.model')

describe('Log.model', () => {
  it('має коректну назву моделі', () => {
    expect(Log.modelName).toBe('Log')
  })

  it('містить усі очікувані шляхи', () => {
    const paths = Object.keys(Log.schema.paths)
    expect(paths).toEqual(
      expect.arrayContaining([
        '_id',
        'url',
        'method',
        'time',
        'user',
        'statusCode',
        'req',
        'res',
        'createdAt',
        'updatedAt',
        '__v',
      ])
    )
  })

  it('url, method та user — String з дефолтом ""', () => {
    ['url', 'method', 'user'].forEach(field => {
      const p = Log.schema.paths[field]
      expect(p.instance).toBe('String')
      expect(p.options.default).toBe('')
    })
  })

  it('time — Number з дефолтом 0', () => {
    const p = Log.schema.paths.time
    expect(p.instance).toBe('Number')
    expect(p.options.default).toBe(0)
  })

  it('statusCode — String з дефолтом null', () => {
    const p = Log.schema.paths.statusCode
    expect(p.instance).toBe('String')
    expect(p.options.default).toBeNull()
  })

  it('req та res — Mixed (тип Object) з дефолтом null', () => {
    const reqPath = Log.schema.paths.req
    const resPath = Log.schema.paths.res
    expect(reqPath.instance).toBe('Mixed')
    expect(reqPath.options.default).toBeNull()
    expect(resPath.instance).toBe('Mixed')
    expect(resPath.options.default).toBeNull()
  })

  it('createdAt та updatedAt — Number (timestamps)', () => {
    expect(Log.schema.paths.createdAt.instance).toBe('Number')
    expect(Log.schema.paths.updatedAt.instance).toBe('Number')
  })
})
