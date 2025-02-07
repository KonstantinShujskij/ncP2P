const Exception = require('@core/Exception')
const Const = require('@core/Const')

const Invoice = require('@models/Invoice.model')
const Payment = require('@controllers/Payment.controller')


// ---------- SUPPORT FUNCTION ----------

async function waitCountByPayment(payment) {
    const list = await Invoice.find({ payment, status: { $in: Const.invoice.activeStatusList } })

    return list.length
}

// ---------- MAIN ----------

async function create({ amount, refId }) {    
    const isExist = refId && !!(await Invoice.findOne({ refId })) 
    if(isExist) { throw Exception.isExist }

    const payment = await Payment.choiceBest(amount)
    if(!payment) { throw Exception.notFind }

    const invoice = new Invoice({ 
        refId, amount,
        initialAmount: amount,
        payment: payment._id
    })

    await save(invoice)
    await Payment.refresh(payment._id)
     
    return invoice
}

async function finalize(id, status=Const.invoice.statusList.REJECT) {
    const invoice = await getActive(id)

    invoice.status = status

    await save(invoice)
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
    const invoice = await getActive(id)

    if(invoice.amount === amount) { return await confirm(id) }

    const delta = amount - invoice.initialAmount
    const available = await Payment.getMaxAvailable(invoice.payment)

    if(delta <= available) { 
        await changeAmount(id, amount)
        return await confirm(id)
    }

    // call support
    // custom callback to NcPay by Intigration

    await changeAmount(id, amount)
    return await confirm(id) 
}

async function approve({id, kvitNumber, kvitFile}) {
    const invoice = await getActive(id)

    //check gov
    const isValid = true
    const amount = invoice.amount + 500
    //-----

    if(!isValid) { invoice.status = Const.invoice.statusList.VALID }

    invoice.kvitFile = kvitFile
    invoice.kvitNumber = kvitNumber

    await save(invoice)

    return await close(id, amount)
}


// ---------- LISTS ----------


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
    const invoice = await Invoice.findOne({ _id })
    if(!invoice) { throw Exception.notFind }

    if(!Const.invoice.activeStatusList.includes(invoice.status)) { 
        throw Exception.cantConfirmInvoice 
    }

    return invoice
}


module.exports = { 
    create,
    reject,
    confirm,
    changeAmount,
    close,
    approve,
    get,
}
