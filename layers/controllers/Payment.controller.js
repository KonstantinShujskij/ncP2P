const Exception = require('@core/Exception')
const Const = require('@core/Const')

const Payment = require('@models/Payment.model')
const Invoice = require('@models/Invoice.model')
const Proof = require('@models/Proof.model')
const Tail = require('@controllers/Tail.controller')

const { round } = require('@utils/utils')
const { makeOrder } = require('@utils/NcApi')
const config = require('config')
const { sendOld } = require('@utils/telegram.utils')
// ---------- SUPPORT FUNCTION ----------

function getMinLimit(amount) {
    if(amount < Const.payment.minLimit.customLimit) { 
        return Const.payment.minLimit.default
    }

    return round(amount * Const.payment.minLimit.persent, 100)
} 

async function invoiceListByPayment(payment) {
    const waitList = await Invoice.find({ payment, status: Const.invoice.statusList.WAIT })
    const activeList = await Invoice.find({ payment, status: { $in: Const.invoice.activeStatusList } })
    const finaleList = await Invoice.find({ payment, status: Const.invoice.statusList.CONFIRM })

    return {
        wait: waitList,
        active: activeList,
        finale: finaleList
    }
}

// ---------- MAIN ----------

async function create({ accessId, author }, { card, amount, refId, partnerId, course }) {    
    const isExist = refId && !!(await Payment.findOne({ refId }))
    if(isExist) { throw Exception.isExist }

    const minLimit = getMinLimit(amount)
    const maxLimit = amount > Const.minNcApiLimit? amount - Const.minNcApiLimit : minLimit
    
    const payment = new Payment({ 
        author, accessId,
        refId, partnerId,
        card, amount, course,
        initialAmount: amount,
        currentAmount: amount,
        minLimit, maxLimit,
    })

    return await save(payment)
}

async function refresh(id) {     
    console.log('refresh')
              
    const payment = await get(id)
    if(payment.status === Const.payment.statusList.REJECT) { return }  
    if(!!payment.tailId) { return sendOld(payment) }  

    const invoiceList = await invoiceListByPayment(id)
    const tails = await Tail.list(id)

    let isOneWait = false
    let isOneValid = false
    let isAllValidOk = true

    invoiceList.active.forEach((invoice) => { 
        if(invoice.status === Const.invoice.statusList.WAIT) { isOneWait = true } 
        if(invoice.status === Const.invoice.statusList.VALID) { 
            if(!invoice.validOk) { 
                isOneValid = true
                isAllValidOk = false 
            }
        } 
    })

    if(!invoiceList.active.length) { isAllValidOk = false }

    payment.isOneWait = isOneWait
    payment.isOneValid = isOneValid
    payment.isAllValidOk = isAllValidOk

    let isTail = false
    let tailAmount = 0

    tails.forEach((tail) => { 
        if(tail.status === Const.tail.statusList.WAIT) { isTail = true } 
        if(tail.status === Const.tail.statusList.CREATE && !!tail.tailId) { isTail = true } 

        if(tail.status === Const.tail.statusList.WAIT || tail.status === Const.tail.statusList.CONFIRM) {
            tailAmount += tail.amount
        }
    })

    const finaleAmount = invoiceList.finale.reduce((amount, invoice) => (amount + invoice.amount), 0)
    const waitAmount = invoiceList.active.reduce((amount, invoice) => (amount + invoice.amount), 0)
    const isWait = !!invoiceList.active.length || isTail

    const currentAmount = payment.initialAmount - tailAmount - finaleAmount - waitAmount    
    const minLimit = getMinLimit(payment.initialAmount)
    const maxLimit = currentAmount - Const.minNcApiLimit

    payment.currentAmount = currentAmount
    payment.isRefresh = true
    payment.isWait = isWait

    if(payment.isFreeze) { 
        payment.status = Const.payment.statusList.BLOCKED

        return await save(payment)
    }
    
    if(!isWait && currentAmount <= 0) { 
        payment.status = Const.payment.statusList.SUCCESS
        payment.amount = payment.initialAmount - currentAmount

        return await save(payment)
    }

    if(maxLimit >= minLimit && maxLimit >= Const.minInvoiceLimit) {      
        payment.status = Const.payment.statusList.ACTIVE
        payment.maxLimit = maxLimit
        
        const isChangeMinLimit = (minLimit !== payment.minLimit)
        if(isChangeMinLimit && maxLimit !== currentAmount) { payment.minLimit = minLimit }
        
        return await save(payment)
    }
    
    if(currentAmount % 100 === 0 && currentAmount >= Const.minInvoiceLimit) {       
        payment.status = Const.payment.statusList.ACTIVE
        payment.minLimit = currentAmount
        payment.maxLimit = currentAmount

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

    payment.status = Const.payment.statusList.BLOCKED
    payment.isWait = true
    payment.isFreeze = true
    
    return await save(payment)
}

async function pushTail(user, id, amount, auto=false) {          
    const payment = user? await getByUser(user, id) : await get(id)

    const invoiceList = await invoiceListByPayment(id)

    // if(payment.isTail) { throw Exception.cantPushTail }
    // if(!!invoiceList.active.length && !payment.isAllValidOk) { throw Exception.cantPushTail }

    if(!!invoiceList.wait.length) { throw Exception.cantPushTail }
    if(auto && payment.currentAmount <= 0) { throw Exception.invalidAmount }

    const tail = await Tail.create(payment.card, auto? payment.currentAmount : amount, payment._id)
    if(tail) { payment.tails.push(tail._id) }
    
    await save(payment)
    await refresh(id)
}

async function closeTail(tailId, status) {     
    const paymentId = await Tail.close(tailId, status)

    return await refresh(paymentId)
}

async function reject(user, id) {   
    const payment = await getByUser(user, id)

    if(payment.status !== Const.payment.statusList.ACTIVE) { return null }
    if(payment.currentAmount !== payment.initialAmount) { return null }

    payment.status = Const.payment.statusList.REJECT

    await save(payment)
    return await refresh(payment._id)
}

async function freeze(user, id) {   
    const payment = await getByUser(user, id)

    payment.status = Const.payment.statusList.BLOCKED
    payment.isFreeze = true

    await save(payment)

    return await refresh(payment._id)
}

async function unfreeze(user, id) {   
    const payment = await getByUser(user, id)

    if(!payment.isFreeze) { return null }

    payment.status = Const.payment.statusList.BLOCKED
    payment.isFreeze = false

    await save(payment)
    return await refresh(payment._id)
}

async function togglePriority(user, id) {   
    const payment = await getByUser(user, id)

    payment.priority = !payment.priority

    return await save(payment)
}

async function getMaxAvailable(id, invoice) {        
    const payment = await get(id)
    const invoiceList = await invoiceListByPayment(id)

    const finaleAmount = invoiceList.finale.reduce((amount, invoice) => (amount + invoice.amount), 0)
    const waitAmount = invoiceList.active.reduce((amount, invoice) => (amount + invoice.amount), 0)

    const currentAmount = payment.initialAmount - payment.tailAmount - finaleAmount - waitAmount - invoice.initialAmount + invoice.amount
    return currentAmount
}

async function sendProofs(user, id) {
    const payment = await getByUser(user, id)

    const proofsList = await Proof.find({ payment: payment._id, status: Const.proof.statusList.CONFIRM })
    const list = proofsList.map((proof) => {        
        return {
            link: proof.fileLink? proof.fileLink : `${config.get('serverUrl')}/kvits/${proof.kvitFile}`,
            payment: payment._id,
            invoice: proof.invoice,
            proof: proof._id
        }
    })
    
    return list
}

// ---------- GET BEST ----------

async function getBestByEqual(amount) {        
    const list = await Payment.find({ 
        status: Const.payment.statusList.ACTIVE, 
        currentAmount: amount, 
        isRefresh: true,
        isTail: false,
        isFreeze: false
    }).sort({ createdAt: 1 })

    return list.length? list[0] : null
}

async function getBestByLimits(amount) {    
    const options = { 
        status: Const.payment.statusList.ACTIVE,
        isFreeze: false,
        minLimit: { $lte: amount }, 
        maxLimit: { $gte: amount }
    }

    const list = await Payment.aggregate([
        {$match: options},
        {$addFields: { delta: { $subtract: ["$maxLimit", amount] }}},
        {$sort: { priority: -1, createdAt: 1 }}
    ])

    return list.length? list[0] : null
}

async function getBest(amount) {    
    const equalBest = await getBestByEqual(amount)    
    if(equalBest) { return await softGet(equalBest._id) }

    const limitBest = await getBestByLimits(amount)
    if(limitBest) { return await softGet(limitBest._id) }

    return null
}

async function choiceBest(amount, step=0) {        
    if(step > Const.maxSaveRecursion) { return null }
    
    const bestPayment = await getBest(amount)
    if(!bestPayment) { return null }

    try {
        bestPayment.isRefresh = false
        return await save(bestPayment)
    }
    catch(error) {
        console.log('----- Cant change best');
        return choiceBest(amount, step + 1)
    }
}

// ---------- STATISTIC ----------

async function getStatistics(user, timestart=0, timestop=Infinity, format="%Y-%m-%d", options={}) {   
    if(user && user.access === Const.userAccess.MAKER) { options.accessId = user.accessId }

    const data = await Payment.aggregate([
        { $match: { ...options, createdAt: { $gt: timestart, $lt: timestop } }},
        { $addFields: {
            date: { $toDate: '$createdAt' },
            dt: { $subtract: [ "$updatedAt", "$createdAt" ]},
        }},
        { $group: {
            _id: { $dateToString: { format, date: "$date" } },
            count: { $sum: 1 },
            countConfirm: { $sum: { $cond: { if: { $eq: ['$status', "SUCCESS"] }, then: 1, else: 0 }}},

            total: { $sum: '$amount'},
            totalConfirm: { $sum: { $cond: { if: { $eq: ['$status', "SUCCESS"] }, then: '$amount', else: 0 }}},
            totalInitialConfirm: { $sum: { $cond: { if: { $eq: ['$status', "SUCCESS"] }, then: '$initialAmount', else: 0 }}},

            totalBlocked: { $sum: { $cond: { if: { $eq: ['$status', "BLOCKED"] }, then: '$currentAmount', else: 0 }}},
            totalInitialBlocked: { $sum: { $cond: { if: { $eq: ['$status', "BLOCKED"] }, then: '$initialAmount', else: 0 }}},

            dt: { $sum: '$dt' }
        }},
        { $sort: { _id: 1 } },
        { $project: {
            count: 1,
            countConfirm: 1,
            conversion: { $divide: [ "$countConfirm", "$count" ] },

            total: 1,
            totalConfirm: 1,
            totalInitialConfirm: 1,

            totalBlocked: 1,
            totalInitialBlocked: 1,

            dt: 1,
        }}
    ]) 
    
    let count = 0
    let confirmCount = 0
    let conversion = 0
    let total = 0
    let totalConfirm = 0
    let totalInitialConfirm = 0
    let avarageTime = 0
    let avarageSum = 0

    let totalInitialBlocked = 0
    let totalBlocked = 0
    let overPayments = 0

    data.forEach((item) => {
        count += item.count
        confirmCount += item.countConfirm

        total += item.total
        totalConfirm += item.totalConfirm
        totalInitialConfirm += item.totalInitialConfirm

        totalBlocked += item.totalBlocked
        totalInitialBlocked += item.totalInitialBlocked

        avarageTime += item.dt
    })   

    conversion = confirmCount / (count || 1)
    avarageTime = avarageTime / (count || 1)
    avarageSum = totalConfirm / (confirmCount || 1)
    overPayments = totalInitialConfirm - totalConfirm + totalBlocked
        
    return {
        count,
        confirmCount,
        conversion,
        total,
        totalConfirm,
        totalInitialConfirm,
        avarageSum,
        avarageTime,
        overPayments
    }
    
    //data
}

// ---------- LIST ----------

async function list(user, options, page, limit) {   
    const sort = { createdAt: -1 }
    const skip = (page - 1) * limit
    
    if(user && user.access === Const.userAccess.MAKER) { options.accessId = user.accessId }

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

async function getByUser(user, id) {
    const payment = await get(id)

    if(user.access === Const.userAccess.MAKER) {
        if(!payment.accessId.equals(user.accessId)) { throw Exception.notFind }
    }

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
    closeTail,
    pushTail,

    list,

    get,
    softGet,
    getByUser,

    reject,
    freeze,
    unfreeze, 
    togglePriority,
    sendProofs,

    getStatistics
}
