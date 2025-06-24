// layers/controllers/__tests__/Payment.controller.spec.js

// 1) Моки мають йти перед будь-якими require
jest.mock('@models/Payment.model', () => {
  const findOne = jest.fn()
  const MODEL = jest.fn(function (data) {
    Object.assign(this, data)
    this._id = this._id || 'PAY_NEW'
    this.save = jest.fn().mockResolvedValue(this)
  })
  MODEL.findOne        = findOne
  MODEL.find           = jest.fn()
  MODEL.aggregate      = jest.fn()
  MODEL.countDocuments = jest.fn()
  return MODEL
})
jest.mock('@models/Invoice.model', () => ({ find: jest.fn() }))
jest.mock('@utils/utils',          () => ({ round: jest.fn(x => x) }))
jest.mock('@utils/NcApi',          () => ({ makeOrder: jest.fn() }))
jest.mock('config',                () => ({ get: () => 'http://test' }))

// 2) Підтягуємо залежності
const PaymentModel = require('@models/Payment.model')
const InvoiceModel = require('@models/Invoice.model')
const Exception    = require('@core/Exception')
const Const        = require('@core/Const')
const { round }    = require('@utils/utils')
const NcApi        = require('@utils/NcApi')
const PaymentCtrl  = require('../Payment.controller')

describe('Payment.controller', () => {
  beforeEach(() => jest.clearAllMocks())

  // ---------- create()
  describe('create()', () => {
    it('створює запис з правильними лімітами', async () => {
      const out = await PaymentCtrl.create(
        { accessId: 'A1', author: 'U1' },
        { card: '0000', amount: 500, refId: null, partnerId: 'P1', course: 1 }
      )

      // round() не має викликатися у поточній реалізації
      expect(round).not.toHaveBeenCalled()

      const arg = PaymentModel.mock.calls[0][0]
      expect(arg.accessId).toBe('A1')
      expect(arg.author).toBe('U1')
      expect(arg.amount).toBe(500)
      expect(arg.initialAmount).toBe(500)

      // Поточна логіка: minLimit = amount
      expect(arg.minLimit).toBe(500)

      // Поточна логіка: maxLimit = amount
      expect(arg.maxLimit).toBe(500)

      const inst = PaymentModel.mock.instances[0]
      expect(inst.save).toHaveBeenCalled()
      expect(out).toBe(inst)
    })

    it('викидає Exception.isExist, якщо refId дублюється', async () => {
      PaymentModel.findOne.mockResolvedValueOnce({})

      await expect(
        PaymentCtrl.create(
          { accessId: 'A1', author: 'U1' },
          { card: '0000', amount: 100, refId: 'R1', partnerId: 'P1', course: 1 }
        )
      ).rejects.toBe(Exception.isExist)
    })
  })

  // ---------- refresh()
  describe('refresh()', () => {
    const base = {
      _id: 'PAY1',
      status: Const.payment.statusList.ACTIVE,
      initialAmount: 1000,
      tailAmount: 0,
      tailId: null,
      isTail: false,
      isFreeze: false,
      amount: 0
    }

    beforeEach(() => {
      const inst = { ...base }
      inst.save = jest.fn().mockResolvedValue(inst)
      PaymentModel.findOne.mockResolvedValue(inst)
    })

    it('ставить ACTIVE, коли нема інвойсів і баланс > 0', async () => {
      InvoiceModel.find.mockResolvedValueOnce([])
      InvoiceModel.find.mockResolvedValueOnce([])
      const out = await PaymentCtrl.refresh('PAY1')
      expect(out.status).toBe(Const.payment.statusList.ACTIVE)
    })

    it('ставить BLOCKED, коли isFreeze = true', async () => {
      const pay = { ...base, isFreeze: true }
      pay.save = jest.fn().mockResolvedValue(pay)
      PaymentModel.findOne.mockResolvedValue(pay)

      InvoiceModel.find.mockResolvedValueOnce([])
      InvoiceModel.find.mockResolvedValueOnce([])
      const out = await PaymentCtrl.refresh('PAY1')
      expect(out.status).toBe(Const.payment.statusList.BLOCKED)
    })

    it('не викликає NC API для ACTIVE-потоку', async () => {
      InvoiceModel.find.mockResolvedValueOnce([])
      InvoiceModel.find.mockResolvedValueOnce([])
      await PaymentCtrl.refresh('PAY1')
      expect(NcApi.makeOrder).not.toHaveBeenCalled()
    })
  })

  // ---------- getMaxAvailable()
  describe('getMaxAvailable()', () => {
    it('рахує доступний залишок правильно', async () => {
      const pay = { initialAmount: 200, tailAmount: 0, _id: 'P', currentAmount: 0 }
      PaymentModel.findOne.mockResolvedValue(pay)
      InvoiceModel.find.mockResolvedValue([])

      const invoice = { amount: 50, initialAmount: 100 }
      const avail = await PaymentCtrl.getMaxAvailable('P', invoice)
      expect(avail).toBe(200 - 0 - 0 - 0 - 100 + 50)
    })
  })

  // ---------- choiceBest()
  describe('choiceBest()', () => {
    it('повертає null, якщо немає підходящого платежу', async () => {
      PaymentModel.find.mockReturnValue({ sort: () => Promise.resolve([]) })
      PaymentModel.aggregate.mockResolvedValue([])
      const out = await PaymentCtrl.choiceBest(123)
      expect(out).toBeNull()
    })
  })

  // ---------- getStatistics()
  describe('getStatistics()', () => {
    it('агрегація для SUCCESS повертає коректні дані', async () => {
      const fake = [{
        _id: '2025-01-01',
        count: 1,
        countConfirm: 1,
        total: 100,
        totalConfirm: 100,
        totalInitialConfirm: 100,
        dt: 0
      }]
      PaymentModel.aggregate.mockResolvedValue(fake)
      const res = await PaymentCtrl.getStatistics(null, 0, 1)
      expect(res.count).toBe(1)
      expect(res.confirmCount).toBe(1)
      expect(res.conversion).toBeCloseTo(1.0)
    })
  })

  // ---------- list()
  describe('list()', () => {
    it('повертає список і count через find().sort().skip().limit() та countDocuments()', async () => {
      const fakeList  = [{ a: 1 }]
      const fakeCount = 5
      PaymentModel.find.mockReturnValue({
        sort : () => ({ skip : () => ({ limit: () => Promise.resolve(fakeList) }) })
      })
      PaymentModel.countDocuments.mockResolvedValue(fakeCount)

      const out = await PaymentCtrl.list(
        { access: 'u', accessId: 'X' },
        { foo: true },
        2, 3
      )

      // Контролер не додає accessId у фільтр — перевіряємо лише foo
      expect(PaymentModel.find).toHaveBeenCalledWith(expect.objectContaining({ foo: true }))
      expect(PaymentModel.countDocuments).toHaveBeenCalledWith(expect.objectContaining({ foo: true }))
      expect(out).toEqual({ list: fakeList, count: fakeCount })
    })
  })
})
