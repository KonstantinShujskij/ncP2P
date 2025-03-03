const { getKvitNumber } = require('@utils/pdf.utils')

const Proof = require('@models/Proof.model')
const Invoice = require('@controllers/Invoice.controller')
const Payment = require('@controllers/Payment.controller')

const CheckGov = require('@utils/CheckGov')
const Exception = require('@core/Exception')
const Const = require('@core/Const')
const Gpt = require('@utils/gpt.utils')


// ------ SUPPORT FUNCTION ------


async function getNumberByKvit(file, bank) {    
    if(!file) { return null }
    
    if(bank === Const.bankList.MONO) { return await getKvitNumber(file) }

    return null
}

// ----- MIAI -----

async function createByNumber(invoiceId, kvitNumber) {
    if(!kvitNumber) { throw Exception.invalidValue }

    const list = await Proof.find({ invoice: invoiceId, status: Const.proof.statusList.WAIT })
    if(list.length >= 2) { throw Exception.manyProofs }
    
    const number = kvitNumber.toUpperCase()

    // const candidat = await Proof.findOne({ kvitNumber: number })
    // if(candidat) { throw Exception.isExist }

    const invoice = await Invoice.get(invoiceId)   
    if(invoice.status === Const.invoice.statusList.CONFIRM) { throw Exception.notFind }

    const payment = await Payment.softGet(invoice.payment)

    const proof = new Proof({
        invoice: invoiceId,
        invoiceRefId: invoice.refId,
        invoicePartnerId: invoice.partnerId,
        invoiceAmount: invoice.initialAmount,
        invoiceCard: invoice.card,
        invoiceDate: invoice.createdAt,

        payment: invoice.payment,
        paymentRefId: payment.refId,
        paymentPartnerId: payment.partnerId,

        kvitNumber: number,
        kvitFile: ''
    })

    await save(proof)
    return await verify(proof._id) 
}

async function createByFile(invoiceId, kvitFile='') {
    if(!kvitFile) { throw Exception.invalidValue }

    const list = await Proof.find({ invoice: invoiceId, status: Const.proof.statusList.WAIT })
    if(list.length >= 2) { throw Exception.manyProofs }

    const invoice = await Invoice.get(invoiceId)   
    if(invoice.status === Const.invoice.statusList.CONFIRM) { throw Exception.notFind }
    
    let number = await getNumberByKvit(kvitFile, invoice.bank) 
    // number = number.toUpperCase()

    // const candidat = await Proof.findOne({ kvitNumber: number })
    // if(candidat && number) { throw Exception.isExist }

    const payment = await Payment.softGet(invoice.payment)

    const proof = new Proof({
        invoice: invoiceId,
        invoiceRefId: invoice.refId,
        invoicePartnerId: invoice.partnerId,

        invoiceAmount: invoice.initialAmount,
        invoiceCard: invoice.card,
        invoiceDate: invoice.createdAt,

        payment: invoice.payment,
        paymentRefId: payment.refId,
        paymentPartnerId: payment.partnerId,

        kvitNumber: number,
        kvitFile
    })

    await save(proof)    
    return await verify(proof._id) 
}

async function verify(id) {
    const proof = await get(id)

    console.log('--- verify proof: ', id)
    console.log('--- bank: ', proof.bank)
    
    if(proof.bank === Const.bankList.MONO) {        
        if(!proof.kvitNumber) { return }
        
        const transaction = await CheckGov.check(proof.kvitNumber)
        console.log('--- Check gov say:', transaction);

        const findKvit = transaction?.kvitNumber?.toUpperCase()
        if(!findKvit) { return }
    
        const candidat = await Proof.findOne({ 
            _id: { $ne: proof._id },
            kvitNumber: findKvit, 
            status: Const.proof.statusList.CONFIRM
        })

        if(candidat) { return }

        if(transaction) { 
            const { kvitNumber, card, amount } = transaction
                       
            gpt(id).then()
            return await complite(proof, { kvitNumber, card, amount }) 
        }
    }

    gpt(id).then()
    return proof
}

async function complite(proof, transaction) {
    proof.kvitNumber = transaction.kvitNumber
    proof.amount = transaction.amount
    proof.status = Const.proof.statusList.CONFIRM  

    if(transaction.card) {
        const payment = await Payment.get(proof.payment)
        if(payment.card.substring(0, 6) !== transaction.card.substring(0, 6)) { return }
    }
    
    const saveProof = await save(proof)

    await Invoice.close(proof.invoice, proof.amount)

    return saveProof
}

async function gpt(id) {
    const proof = await get(id)
    const fileName = proof.kvitFile
    
    const arr = fileName.split('.')
    if(!arr.length) { return }

    const exts = ['png', 'jpg']
    const ext = arr[arr.length - 1]    

    let data = null

    if(exts.includes(ext)) { data = await Gpt.getImageData(fileName) }
    if(ext === 'pdf') { data = await Gpt.getPdfData(fileName) }
    
    if(!data) { return false }
        
    proof.gpt.number = data['invoice_number']
    proof.gpt.amount = data["amount"]
    proof.gpt.card = data["recipient_card"]
    proof.gpt.date = data["invoice_date"]

    await save(proof)
    return true
}

// ---------- SUPPORT ------------

async function decline(id) {
    const proof = await get(id)
    if(proof.status !== Const.proof.statusList.WAIT) { throw Exception.notFind }

    proof.status = Const.proof.statusList.REJECT

    return await save(proof)
}

async function approve({id, amount, kvitNumber}) {  
    console.log('approve');
      
    const proof = await get(id)
    if(proof.status !== Const.proof.statusList.WAIT) { throw Exception.notFind }

    console.log('Proof in wait');

    const findKvit = kvitNumber?.toUpperCase()
    if(!findKvit) { throw Exception.invalidValue }

    console.log('kvit find number');

    const candidat = await Proof.findOne({ 
        _id: { $ne: proof._id },
        kvitNumber: findKvit, 
        status: Const.proof.statusList.CONFIRM
    })
    
    if(candidat) { throw Exception.isExist }

    return await complite(proof, { amount, kvitNumber })
}

// ---------- LISTS ------------

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


async function save(proof) {
    try { return await proof.save() }
    catch(e) { throw Exception.notCanSaveModel }
}

async function get(_id) {
    const proof = await Proof.findOne({ _id })
    if(!proof) { throw Exception.notFind }

    return proof
}

async function getList(options={}, sort={}, skip=0, limit=50) {   
    try { 
        const list = await Proof.find(options).sort(sort).skip(skip).limit(limit)  
        const count = await Proof.countDocuments(options)

        return { list, count }
    }
    catch(err) { 
        return null
    }
}


module.exports = { 
    createByNumber,
    createByFile,
    verify,

    decline,
    approve,

    get,
    list,
    gpt
}
