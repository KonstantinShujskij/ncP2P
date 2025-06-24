// layers/validate/__tests__/Proof.validate.test.js
const {
  create,
  clientNumber,
  clientFile,
  decline,
  approve,
  recheck,
  list
} = require('../Proof.validate')

describe('Proof.validate', () => {
  it('create: масив з 2 перевірок на invoice та kvitNumber', () => {
    expect(Array.isArray(create)).toBe(true)
    expect(create).toHaveLength(2)
    const fields = create.map(chain => chain.builder.fields[0])
    expect(fields).toEqual(['invoice', 'kvitNumber'])
  })

  it('clientNumber: масив з 2 перевірок на hash та kvitNumber', () => {
    expect(Array.isArray(clientNumber)).toBe(true)
    expect(clientNumber).toHaveLength(2)
    const fields = clientNumber.map(chain => chain.builder.fields[0])
    expect(fields).toEqual(['hash', 'kvitNumber'])
  })

  it('clientFile: масив з 1 перевірки на hash', () => {
    expect(Array.isArray(clientFile)).toBe(true)
    expect(clientFile).toHaveLength(1)
    expect(clientFile[0].builder.fields).toEqual(['hash'])
  })

  it('decline: масив з 1 перевірки на id', () => {
    expect(Array.isArray(decline)).toBe(true)
    expect(decline).toHaveLength(1)
    expect(decline[0].builder.fields).toEqual(['id'])
  })

  it('approve: масив з 2 перевірок на amount та kvitNumber', () => {
    expect(Array.isArray(approve)).toBe(true)
    expect(approve).toHaveLength(2)
    const fields = approve.map(chain => chain.builder.fields[0])
    expect(fields).toEqual(['amount', 'kvitNumber'])
  })

  it('recheck: масив з 3 перевірок на id, bank та number', () => {
    expect(Array.isArray(recheck)).toBe(true)
    expect(recheck).toHaveLength(3)
    const fields = recheck.map(chain => chain.builder.fields[0])
    expect(fields).toEqual(['id', 'bank', 'number'])
  })

  it('list: перевіряє поля filter, page, limit', () => {
    expect(Array.isArray(list)).toBe(true)
    expect(list).toHaveLength(3)
    const fields = list.map(chain => chain.builder.fields[0])
    expect(fields).toEqual(['filter', 'page', 'limit'])
  })
})
