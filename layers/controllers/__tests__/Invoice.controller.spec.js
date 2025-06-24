// layers/controllers/__tests__/Invoice.controller.spec.js
const Exception = require('@core/Exception')
const Const = require('@core/Const')

// Мокаємо модель як конструктор з static-методами
jest.mock('@models/Invoice.model', () => {
  const findOne = jest.fn()
  const aggregate = jest.fn()
  const find = jest.fn()
  const countDocuments = jest.fn()
  const MODEL = function (data) {
    Object.assign(this, data)
    this._id = this._id || 'I_NEW'
    this.save = jest.fn().mockResolvedValue(this)
  }
  MODEL.findOne = findOne
  MODEL.aggregate = aggregate
  MODEL.find = find
  MODEL.countDocuments = countDocuments
  return MODEL
})

// Мокаємо інші залежності
jest.mock('@controllers/Payment.controller', () => ({
  choiceBest: jest.fn(),
  refresh: jest.fn(),
  getMaxAvailable: jest.fn(),
}))
jest.mock('@utils/Jwt.utils', () => ({
  generateLinkJwt: jest.fn().mockReturnValue('HASH'),
}))
jest.mock('@utils/NcPay', () => ({ callback: jest.fn() }))
jest.mock('@utils/telegram.utils', () => ({
  moreAmount: jest.fn(),
  clientHasActive: jest.fn(),
}))

const InvoiceModel = require('@models/Invoice.model')
const PaymentService = require('@controllers/Payment.controller')
const Jwt = require('@utils/Jwt.utils')
const NcPay = require('@utils/NcPay')
const telegram = require('@utils/telegram.utils')

const {
  create,
  reject,
  confirm,
  changeAmount,
  close,
  pay,
  toValid,
  toValidOk,
  getStatistics,
  list,
} = require('../Invoice.controller')

describe('Invoice.controller', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('create()', () => {
    it('повертає Exception.isExist, якщо refId вже є', async () => {
      InvoiceModel.findOne.mockResolvedValueOnce({})
      await expect(
        create({ amount:1, bank:'B', refId:'R', partnerId:'P', client:'C' })
      ).rejects.toBe(Exception.isExist)
    })

    it('повертає Exception.clientHasActive, якщо є активний інвойс', async () => {
      InvoiceModel.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ _id:'A1' })
      await expect(
        create({ amount:1, bank:'B', refId:'R', partnerId:'P', client:'C' })
      ).rejects.toBe(Exception.clientHasActive)
      expect(telegram.clientHasActive).toHaveBeenCalledWith({ _id:'A1' })
    })

    it('успішно створює інвойс і повертає його з payLink', async () => {
      InvoiceModel.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
      PaymentService.choiceBest.mockResolvedValue({
        _id:'PAY1', accessId:'ACC', refId:'R1', partnerId:'P1', card:'0000'
      })
      InvoiceModel.aggregate.mockResolvedValue([{ countConfirm:2, count:5 }])

      const inv = await create({
        amount:100, bank:'B', refId:'R1', partnerId:'P', client:'C'
      })

      expect(Jwt.generateLinkJwt).toHaveBeenCalledWith('I_NEW')
      expect(inv.payLink).toContain('?hash=HASH')
      expect(PaymentService.refresh).toHaveBeenCalledWith('PAY1')
    })
  })

  describe('reject / confirm', () => {
    it('reject() викликає callback і refresh', async () => {
      const inv = { status:'X', _id:'I1', payment:'PAY', save: jest.fn() }
      inv.save.mockResolvedValue(inv)
      InvoiceModel.findOne.mockResolvedValue(inv)

      const out = await reject({ access:'u' }, 'I1')

      expect(inv.status).toBe(Const.invoice.statusList.REJECT)
      expect(NcPay.callback).toHaveBeenCalledWith(inv)
      expect(PaymentService.refresh).toHaveBeenCalledWith('PAY')
      expect(out).toEqual(inv)
    })

    it('confirm() без callback, коли stopCallback=true', async () => {
      const inv = { status:'X', _id:'I2', payment:'P2', save: jest.fn() }
      inv.save.mockResolvedValue(inv)
      InvoiceModel.findOne.mockResolvedValue(inv)

      const out = await confirm('I2', true)

      expect(NcPay.callback).not.toHaveBeenCalled()
      expect(out).toEqual(inv)
    })
  })

  describe('changeAmount()', () => {
    it('змінює amount і зберігає', async () => {
      const inv = { amount:5, save: jest.fn() }
      inv.save.mockResolvedValue(inv)
      InvoiceModel.findOne.mockResolvedValue(inv)

      await changeAmount('I3', 20)

      expect(inv.amount).toBe(20)
      expect(inv.save).toHaveBeenCalled()
    })
  })

  describe('close()', () => {
    it('викидає notFind, якщо CONFIRM', async () => {
      InvoiceModel.findOne.mockResolvedValue({ status:Const.invoice.statusList.CONFIRM })
      await expect(close('I4',10)).rejects.toBe(Exception.notFind)
    })

    it('повертає confirm, якщо amount===initialAmount', async () => {
      const inv = {
        status:'OPEN', initialAmount:30, amount:30,
        payment:'P3', save: jest.fn(), _id:'I5'
      }
      inv.save.mockResolvedValue(inv)
      InvoiceModel.findOne.mockResolvedValue(inv)
      jest.spyOn(PaymentService, 'getMaxAvailable').mockResolvedValue(0)

      const out = await close('I5',30)
      expect(out).toEqual(inv)
    })

    it('викликає moreAmount і callback при delta>available', async () => {
      const inv = {
        status:'OPEN', initialAmount:10, amount:60,
        payment:'P4', save: jest.fn(), _id:'I6', _doc:{}
      }
      inv.save.mockResolvedValue(inv)
      InvoiceModel.findOne.mockResolvedValue(inv)
      jest.spyOn(PaymentService, 'getMaxAvailable').mockResolvedValue(5)

      const out = await close('I6',50)
      expect(telegram.moreAmount).toHaveBeenCalledWith(inv,50)
      expect(NcPay.callback).toHaveBeenCalled()
      expect(out).toEqual(inv)
    })
  })

  describe('pay()', () => {
    it('міняє статус і викликає refresh', async () => {
      const inv = { status:'OPEN', payment:'P5', _id:'I7', save: jest.fn() }
      inv.save.mockResolvedValue(inv)
      InvoiceModel.findOne.mockResolvedValue(inv)

      const out = await pay('I7')

      expect(inv.status).toBe(Const.invoice.statusList.VALID)
      expect(PaymentService.refresh).toHaveBeenCalledWith('P5')
      expect(out).toEqual(inv)
    })
  })

  describe('toValid / toValidOk', () => {
    it('toValid кидає, якщо status!==REJECT', async () => {
      InvoiceModel.findOne.mockResolvedValue({ status:'OPEN' })
      await expect(toValid({access:'u'}, 'I8')).rejects.toBe(Exception.notFind)
    })

    it('toValidOk міняє validOk і refresh', async () => {
      const inv = {
        status:Const.invoice.statusList.REJECT,
        validOk:false,
        payment:'P9',
        save: jest.fn()
      }
      inv.save.mockResolvedValue(inv)
      InvoiceModel.findOne.mockResolvedValue(inv)

      const out = await toValidOk({ access:'u', accessId:'X' }, 'I9')

      expect(inv.validOk).toBe(true)
      expect(PaymentService.refresh).toHaveBeenCalledWith('P9')
      expect(out).toEqual(inv)
    })
  })

  describe('getStatistics()', () => {
    it('повертає нулі, якщо нема записів', async () => {
      InvoiceModel.aggregate.mockResolvedValue([])
      const res = await getStatistics({ access:Const.userAccess.MAKER, accessId:'A' }, 0, 100)

      expect(InvoiceModel.aggregate).toHaveBeenCalled()
      expect(res).toEqual({
        count: 0,
        confirmCount: 0,
        conversion: 0,
        total: 0,
        totalConfirm: 0,
        totalInitialConfirm: 0,
        avarageSum: 0,
        avarageTime: 0
      })
    })
  })

  describe('list()', () => {
    it('повертає дані з Invoice.find і countDocuments', async () => {
      const fakeList = [{ foo: 1 }, { foo: 2 }]
      InvoiceModel.find.mockReturnValue({
        sort: () => ({
          skip: () => ({
            limit: async () => fakeList
          })
        })
      })
      InvoiceModel.countDocuments.mockResolvedValue(42)

      const res = await list({ access:'u', accessId:'A' }, { f:true }, 2, 5)

      expect(InvoiceModel.find).toHaveBeenCalledWith({ f:true })
      expect(res).toEqual({ list: fakeList, count: 42 })
    })
  })
})
