const Exception = require('@core/Exception')
const Const = require('@core/Const')

const Payment = require('@models/Payment.model')
const Invoice = require('@models/Invoice.model')

const Filter = require('@filter/Payment.filters')

const { round } = require('@utils/utils')


// ---------- SUPPORT FUNCTION ----------

function getMinLimit(amount) {
    if(amount < Const.payment.minLimit.customLimit) { 
        return Const.payment.minLimit.default
    }

    return round(amount * Const.payment.minLimit.persent, 100)
} 

async function invoiceListByPayment(payment) {
    const activeList = await Invoice.find({ payment, status: { $in: Const.invoice.activeStatusList } })
    const finaleList = await Invoice.find({ payment, status: Const.invoice.statusList.CONFIRM })

    return {
        active: activeList,
        finale: finaleList
    }
}

// ---------- MAIN ----------

async function create({ card, amount, refId, partnerId }) {    
    const isExist = refId && !!(await Payment.findOne({ refId })) 
    if(isExist) { throw Exception.isExist }

    const minLimit = getMinLimit(amount)
    const maxLimit = amount > Const.minNcApiLimit? amount - Const.minNcApiLimit : minLimit
    
    const payment = new Payment({ 
        refId, partnerId,
        card, amount,
        initialAmount: amount,
        currentAmount: amount,
        minLimit, maxLimit,
    })

    return await save(payment)
}

async function refresh(id) {        
    const payment = await get(id)

    if(payment.status === Const.payment.statusList.REJECT) { throw Exception.cantRefreshPayment }

    const invoiceList = await invoiceListByPayment(id)

    const finaleAmount = invoiceList.finale.reduce((amount, invoice) => (amount + invoice.amount), 0);
    const waitAmount = invoiceList.active.reduce((amount, invoice) => (amount + invoice.amount), 0);
    const isWait = !!invoiceList.active.length || payment.isTail

    const currentAmount = payment.initialAmount - payment.tailAmount - finaleAmount - waitAmount
    const minLimit = getMinLimit(payment.initialAmount)
    const maxLimit = currentAmount - Const.minNcApiLimit

    payment.currentAmount = currentAmount
    payment.isRefresh = true
    payment.isWait = isWait

    if(!isWait && currentAmount <= 0) { 
        payment.status = Const.payment.statusList.SUCCESS
        payment.amount = payment.initialAmount - currentAmount

        return await save(payment)
    }
    
    if(maxLimit >= minLimit && maxLimit >= Const.minInvoiceLimit) {        
        payment.status = Const.payment.statusList.ACTIVE
        payment.maxLimit = maxLimit
        
        return await save(payment)
    }    

    if(isWait) {
        payment.status = Const.payment.statusList.BLOCKED
        payment.maxLimit = Math.max(maxLimit, minLimit)

        return await save(payment)
    }

    const isRound = currentAmount % 100 === 0
    const isSmall = currentAmount < Const.smallLim

    if(isRound && isSmall) {
        payment.status = Const.payment.statusList.ACTIVE
        payment.minLimit = currentAmount
        payment.maxLimit = currentAmount

        return await save(payment)
    }

    //NCAPI

    payment.status = Const.statusList.BLOCKED
    payment.isWait = true

    // in integration
    payment.isTail = true
    payment.tailId = 'NCAPI'
    payment.tailAmount = 0

    return payment
}

async function getMaxAvailable(id) {        
    const payment = await get(id)
    const invoiceList = await invoiceListByPayment(id)

    const finaleAmount = invoiceList.finale.reduce((amount, invoice) => (amount + invoice.amount), 0);
    const waitAmount = invoiceList.active.reduce((amount, invoice) => (amount + invoice.amount), 0);

    const currentAmount = payment.initialAmount - payment.tailAmount - finaleAmount - waitAmount
    const maxLimit = currentAmount - Const.minNcApiLimit

    return maxLimit
}

// ---------- GET BEST ----------

async function getBestByEqual(amount) {    
    console.log('BEST EQ:', amount);
    
    const list = await Payment.find({ 
        status: Const.payment.statusList.ACTIVE, 
        currentAmount: amount, 
        isRefresh: true,
        isWait: false
    }).sort({ createdAt: 1 })

    return list.length? list[0] : null
}

async function getBestByLimits(amount) {    
    const options = { 
        status: Const.payment.statusList.ACTIVE,
        minLimit: { $lte: amount }, 
        maxLimit: { $gte: amount }
    }

    const list = await Payment.aggregate([
        {$match: options},
        {$addFields: { delta: { $subtract: ["$maxLimit", amount] }}},
        {$sort: { delta: 1, createdAt: 1 }}
    ])

    return list.length? list[0] : null
}

async function getBest(amount) {    
    const equalBest = await getBestByEqual(amount)
    console.log('equils', equalBest);
    
    if(equalBest) { return await softGet(equalBest._id) }

    const limitBest = await getBestByLimits(amount)
    if(limitBest) { return await softGet(limitBest._id) }

    return null
}

async function choiceBest(amount, step=0) {    
    console.log('GET BEST');
    
    if(step > Const.maxSaveRecursion) { return null }
    
    const bestPayment = await getBest(amount)
    if(!bestPayment) { return null }

    console.log('BEST:', bestPayment);

    try {
        bestPayment.isRefresh = false
        return await save(bestPayment)
    }
    catch(error) {
        console.log(error);
        return choiceBest(amount, step + 1)
    }
}

// ---------- LIST ----------

async function list(options, page, limit) {   
    console.log('opt', options);
    
    // const options = {...Filter.admin(filter)}
    const sort = { createdAt: -1 }
    const skip = (page - 1) * limit

    const List = await getList(options, sort, skip, limit)

    return { 
        list: List?.list || [], 
        count: List?.count || 0
    }
}

// ---------- DEFAULT ----------

async function save(payment) {
    try { return await payment.save() }
    catch(e) { throw Exception.notCanSaveModel }
}

async function get(_id) {
    const payment = await Payment.findOne({ _id })
    if(!payment) { throw Exception.notFind }
    
    return payment
}

async function softGet(_id) {
    const payment = await Payment.findOne({ _id })
    if(!payment) { return null }
    
    return payment
}

async function getList(options={}, sort={}, skip=0, limit=50) {   
    try { 
        const list = await Payment.find(options).sort(sort).skip(skip).limit(limit)  
        const count = await Payment.countDocuments(options)

        return { list, count }
    }
    catch(err) { 
        return null
    }
}


module.exports = { 
    create,
    refresh,
    getMaxAvailable,

    choiceBest,

    list,

    get,
    softGet
}
