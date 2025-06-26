// layers/serialize/__tests__/User.serialize.test.js
const { crerate, login, twoFA } = require('../User.serialize')

describe('User.serialize', () => {
  let req, res, next

  beforeEach(() => {
    req = { body: {} }
    res = {}
    next = jest.fn()
  })

  it('crerate: формує req.body з login, password, telegram', () => {
    req.body = { login: 'user1', password: 'pass', telegram: '@tg' }
    crerate(req, res, next)
    expect(req.body).toEqual({
      login: 'user1',
      password: 'pass',
      telegram: '@tg'
    })
    expect(next).toHaveBeenCalled()
  })

  it('login: формує req.body з login і password', () => {
    req.body = { login: 'user2', password: 'secret', extra: 'x' }
    login(req, res, next)
    expect(req.body).toEqual({
      login: 'user2',
      password: 'secret'
    })
    expect(next).toHaveBeenCalled()
  })

  it('twoFA: формує req.body з login, password і code', () => {
    req.body = { login: 'user3', password: 'pwd', code: '123456', foo: 'bar' }
    twoFA(req, res, next)
    expect(req.body).toEqual({
      login: 'user3',
      password: 'pwd',
      code: '123456'
    })
    expect(next).toHaveBeenCalled()
  })
})
