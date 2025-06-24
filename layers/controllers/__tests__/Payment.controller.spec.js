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
jest.mock('@models/Proof.model',   () => ({ find: jest.fn() }))
jest.mock('@utils/utils',          () => ({ round: jest.fn(x => x) }))
jest.mock('@utils/NcApi',          () => ({ makeOrder: jest.fn() }))
jest.mock('config',                () => ({ get: () => 'http://test' }))

// 2) Підтягуємо залежності
const PaymentModel = require('@models/Payment.model')
const InvoiceModel = require('@models/Invoice.model')
const ProofModel   = require('@models/Proof.model')
const Exception    = require('@core/Exception')
const Const        = require('@core/Const')
const { round }    = require('@utils/utils')
const NcApi        = require('@utils/NcApi')
const PaymentCtrl  = require('../Payment.controller')

describe('Payment.controller', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // invoice.find за замовчуванням повертає порожній масив
    InvoiceModel.find.mockResolvedValue([])
  })

  // ---------- create()
  describe('create()', () => {
    it('створює запис з правильними лімітами', async () => {
      const out = await PaymentCtrl.create(
        { accessId: 'A1', author: 'U1' },
        { card: '0000', amount: 500, refId: null, partnerId: 'P1', course: 1 }
      )
      expect(round).not.toHaveBeenCalled()
      const args = PaymentModel.mock.calls[0][0]
      expect(args).toEqual(expect.objectContaining({ accessId: 'A1', author: 'U1', amount: 500, initialAmount: 500, minLimit: 500, maxLimit: 500 }))
      const inst = PaymentModel.mock.instances[0]
      expect(inst.save).toHaveBeenCalled()
      expect(out).toBe(inst)
    })

    it('викидає Exception.isExist, якщо refId дублюється', async () => {
      PaymentModel.findOne.mockResolvedValueOnce({})
      await expect(PaymentCtrl.create(
        { accessId: 'A1', author: 'U1' },
        { card: '0000', amount: 100, refId: 'R1', partnerId: 'P1', course: 1 }
      )).rejects.toBe(Exception.isExist)
    })
  })

  // ---------- refresh()
  describe('refresh()', () => {
    const base = {
      _id: 'PAY1', status: Const.payment.statusList.ACTIVE,
      initialAmount: 1000, tailAmount: 0, tailId: null,
      isTail: false, isFreeze: false, amount: 0
    }

    beforeEach(() => {
      const inst = { ...base }
      inst.save = jest.fn().mockResolvedValue(inst)
      PaymentModel.findOne.mockResolvedValue(inst)
    })

    it('ACTIVE, коли нема інвойсів і баланс > 0', async () => {
      InvoiceModel.find.mockResolvedValueOnce([]).mockResolvedValueOnce([])
      const out = await PaymentCtrl.refresh('PAY1')
      expect(out.status).toBe(Const.payment.statusList.ACTIVE)
    })

    it('BLOCKED, коли isFreeze = true', async () => {
      const pay = { ...base, isFreeze: true }
      pay.save = jest.fn().mockResolvedValue(pay)
      PaymentModel.findOne.mockResolvedValue(pay)
      InvoiceModel.find.mockResolvedValueOnce([]).mockResolvedValueOnce([])
      const out = await PaymentCtrl.refresh('PAY1')
      expect(out.status).toBe(Const.payment.statusList.BLOCKED)
    })

    it('не викликає NC API для ACTIVE потоку', async () => {
      InvoiceModel.find.mockResolvedValueOnce([]).mockResolvedValueOnce([])
      await PaymentCtrl.refresh('PAY1')
      expect(NcApi.makeOrder).not.toHaveBeenCalled()
    })
  })

  // ---------- getMaxAvailable()
  describe('getMaxAvailable()', () => {
    it('рахує доступний залишок правильно', async () => {
      const pay = { initialAmount: 200, tailAmount: 0, _id: 'P' }
      PaymentModel.findOne.mockResolvedValue(pay)
      InvoiceModel.find.mockResolvedValue([])
      const invoice = { amount: 50, initialAmount: 100 }
      const avail = await PaymentCtrl.getMaxAvailable('P', invoice)
      expect(avail).toBe(200 - 100 + 50)
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
    it('агрегація SUCCESS повертає коректні дані', async () => {
      const fake = [{ _id: '2025-01-01', count: 1, countConfirm: 1, total: 100, totalConfirm: 100, totalInitialConfirm: 100, dt: 0 }]
      PaymentModel.aggregate.mockResolvedValue(fake)
      const res = await PaymentCtrl.getStatistics(null, 0, 1)
      expect(res.conversion).toBeCloseTo(1)
      expect(res.totalConfirm).toBe(100)
    })
  })

  // ---------- list()
  describe('list()', () => {
    it('повертає список і count', async () => {
      const fakeList = [{ a: 1 }], fakeCount = 5
      PaymentModel.find.mockReturnValue({ sort: () => ({ skip: () => ({ limit: () => Promise.resolve(fakeList) }) }) })
      PaymentModel.countDocuments.mockResolvedValue(fakeCount)
      const out = await PaymentCtrl.list({}, {}, 1, 10)
      expect(out).toEqual({ list: fakeList, count: fakeCount })
    })
  })

  // ---------- pushTail()
  describe('pushTail()', () => {
    it('Exception.cantPushTail при isTail=true', async () => {
      PaymentModel.findOne.mockResolvedValue({ isTail: true, accessId: 'X' })
      await expect(PaymentCtrl.pushTail({ access:'U', accessId:'X' }, 'ID')).rejects.toBe(Exception.cantPushTail)
    })

    it('Exception.cantPushTail при неуспішних інвойсах', async () => {
      const pay = { isTail: false, isAllValidOk: false, accessId: 'X' }
      PaymentModel.findOne.mockResolvedValue(pay)
      InvoiceModel.find.mockResolvedValue([{}])
      await expect(PaymentCtrl.pushTail({ access:'U', accessId:'X' }, 'ID')).rejects.toBe(Exception.cantPushTail)
    })

    it('викликає NC API при валідному', async () => {
      const pay = { isTail:false, isAllValidOk:true, card:'C', currentAmount:10, _id:'ID', accessId:'X' }
      PaymentModel.findOne.mockResolvedValue(pay)
      InvoiceModel.find.mockResolvedValueOnce([]).mockResolvedValueOnce([])
      await PaymentCtrl.pushTail({ access:'U', accessId:'X' }, 'ID')
      expect(NcApi.makeOrder).toHaveBeenCalledWith('C',10,'ID',expect.any(Function))
    })
  })

  // ---------- closeTail()
  describe('closeTail()', () => {
    it('нічого не робить при status != CONFIRM', async () => {
      PaymentModel.findOne.mockClear()
      const res = await PaymentCtrl.closeTail('TAIL','WAIT')
      expect(res).toBeUndefined()
      expect(PaymentModel.findOne).not.toHaveBeenCalled()
    })

    it('оновлює status та повертає payment при CONFIRM', async () => {
      const pay = { status:'OLD', isTail:true, _id:'ID', initialAmount:500, tailAmount:0 }
      pay.save = jest.fn().mockResolvedValue(pay)
      PaymentModel.findOne.mockResolvedValueOnce(pay).mockResolvedValueOnce(pay)
      InvoiceModel.find.mockResolvedValue([])
      const out = await PaymentCtrl.closeTail('TAIL','CONFIRM')
      // status->SUCCESS, потім refresh->ACTIVE
      expect(pay.status).toBe(Const.payment.statusList.ACTIVE)
      expect(out).toBe(pay)
    })
  })

  // ---------- reject()
  describe('reject()', () => {
    it('повертає null, якщо status!=ACTIVE', async () => {
      PaymentModel.findOne.mockResolvedValue({ status:'NEW', currentAmount:50, initialAmount:100 })
      const res = await PaymentCtrl.reject({},{},'ID')
      expect(res).toBeNull()
    })

    it('становить REJECT і повертає undefined при дотриманні', async () => {
      const pay = { status:Const.payment.statusList.ACTIVE, currentAmount:100, initialAmount:100, _id:'ID' }
      pay.save=jest.fn().mockResolvedValue(pay)
      PaymentModel.findOne.mockResolvedValueOnce(pay).mockResolvedValueOnce(pay)
      InvoiceModel.find.mockResolvedValue([])
      const res = await PaymentCtrl.reject({ access:'U', accessId:'X' },'ID')
      expect(pay.status).toBe(Const.payment.statusList.REJECT)
      expect(res).toBeUndefined()
    })
  })

  // ---------- freeze()/unfreeze()
  describe('freeze()', () => {
    it('становить BLOCKED і повертає payment', async () => {
      const pay={status:'ANY',isFreeze:false,_id:'ID'}
      pay.save=jest.fn().mockResolvedValue(pay)
      PaymentModel.findOne.mockResolvedValue(pay)
      InvoiceModel.find.mockResolvedValue([])
      const out=await PaymentCtrl.freeze({access:'U',accessId:'X'},'ID')
      expect(pay.status).toBe(Const.payment.statusList.BLOCKED)
      expect(pay.isFreeze).toBe(true)
      expect(out).toBe(pay)
    })
  })

  describe('unfreeze()',()=>{
    it('повертає null якщо not frozen',async()=>{
      PaymentModel.findOne.mockResolvedValue({isFreeze:false})
      const res=await PaymentCtrl.unfreeze({},{},'ID')
      expect(res).toBeNull()
    })

    it('снімає freeze і повертає payment',async()=>{
      const pay={status:'ANY',isFreeze:true,_id:'ID'}
      pay.save=jest.fn().mockResolvedValue(pay)
      PaymentModel.findOne.mockResolvedValue(pay)
      InvoiceModel.find.mockResolvedValue([])
      const out=await PaymentCtrl.unfreeze({access:'U',accessId:'X'},'ID')
      expect(pay.isFreeze).toBe(false)
      expect(pay.status).toBe(Const.payment.statusList.BLOCKED)
      expect(out).toBe(pay)
    })
  })

  // ---------- togglePriority()
  describe('togglePriority()',()=>{
    it('перемикає priority',async()=>{
      const pay={priority:false,save:jest.fn().mockResolvedValue('OK')}
      PaymentModel.findOne.mockResolvedValue(pay)
      const res=await PaymentCtrl.togglePriority({access:'U',accessId:'X'},'ID')
      expect(pay.priority).toBe(true)
      expect(res).toBe('OK')
    })
  })

  // ---------- sendProofs()
  describe('sendProofs()',()=>{
    it('повертає лінки',async()=>{
      const proof={fileLink:null,kvitFile:'F.pdf',invoice:'I',_id:'PR'}
      ProofModel.find.mockResolvedValue([proof])
      const pay={_id:'PID'}
      PaymentModel.findOne.mockResolvedValue(pay)
      const out=await PaymentCtrl.sendProofs({access:'U',accessId:'X'},'PID')
      expect(out[0].link).toContain('/kvits/F.pdf')
    })
  })
})
