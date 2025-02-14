const Exception = require('@core/Exception')
const Const = require('@core/Const')

const Invoice = require('@models/Invoice.model')
const Payment = require('@controllers/Payment.controller')
const NcPay = require('@utils/NcPay')


// ---------- SUPPORT FUNCTION ----------


// ---------- MAIN ----------

async function create({ amount, bank, refId, partnerId }) {    
    const isExist = refId && !!(await Invoice.findOne({ refId })) 
    if(isExist) { throw Exception.isExist }

    const payment = await Payment.choiceBest(amount)
    if(!payment) { throw Exception.notFind }

    const invoice = new Invoice({ 
        refId, partnerId,
        initialAmount: amount,
        amount,
        bank, 
        payment: payment._id,
        card: payment.card
    })

    await save(invoice)
    await Payment.refresh(payment._id)
     
    return invoice
}

async function finalize(id, status=Const.invoice.statusList.REJECT) {
    const invoice = await getActive(id)

    invoice.status = status

    const newInvoice = await save(invoice)

    NcPay.callback(newInvoice)

    // callback
    
    await Payment.refresh(invoice.payment)

    return invoice
}

async function reject(id) { return await finalize(id, Const.invoice.statusList.REJECT) }
async function confirm(id) { return await finalize(id, Const.invoice.statusList.CONFIRM) }

async function changeAmount(id, amount) {    
    const invoice = await getActive(id)

    invoice.amount = amount

    return await save(invoice)
}

async function close(id, amount) {    
    const invoice = await get(id)

    if(invoice.status === Const.invoice.statusList.CONFIRM) { throw Exception.notFind }
    
    if(invoice.amount === amount) { return await confirm(id) }

    const delta = amount - invoice.initialAmount
    const available = await Payment.getMaxAvailable(invoice.payment)

    if(delta <= available) { 
        await changeAmount(id, amount)
        return await confirm(id)
    }

    // call support
    // custom callback to NcPay by Intigration
    NcPay.callback({...invoice, amount: invoice.amount + available })

    await changeAmount(id, amount)    
    return await confirm(id) 
}

async function pay(id) {
    const invoice = await getActive(id)

    invoice.status = Const.invoice.statusList.VALID

    return await save(invoice)
}


// ---------- LISTS ----------

async function list(options, page, limit) {       
    const sort = { createdAt: -1 }
    const skip = (page - 1) * limit

    const List = await getList(options, sort, skip, limit)

    return { 
        list: List?.list || [], 
        count: List?.count || 0
    }
}

// ---------- DEFAULT ----------

async function save(invoice) {
    try { return await invoice.save() }
    catch(e) { throw Exception.notCanSaveModel }
}

async function get(_id) {
    const invoice = await Invoice.findOne({ _id })
    if(!invoice) { throw Exception.notFind }
    
    return invoice
}

async function getActive(_id) {
    const invoice = await Invoice.findOne({ _id, status: {$in: Const.invoice.activeStatusList} })
    if(!invoice) { throw Exception.notFind }

    return invoice
}

async function getList(options={}, sort={}, skip=0, limit=50) {   
    try { 
        const list = await Invoice.find(options).sort(sort).skip(skip).limit(limit)  
        const count = await Invoice.countDocuments(options)

        return { list, count }
    }
    catch(err) { 
        return null
    }
}


module.exports = { 
    create,
    reject,
    confirm,
    changeAmount,
    close,
    pay,

    get,
    list
}
