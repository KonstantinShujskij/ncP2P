const { getKvitNumber, getBankByKvit, getPrivatKvitNumber } = require('@utils/pdf.utils')

const Proof = require('@models/Proof.model')
const Invoice = require('@controllers/Invoice.controller')
const Payment = require('@controllers/Payment.controller')

const CheckGov = require('@utils/CheckGov')
const Privat = require('@utils/Privat')
const Exception = require('@core/Exception')
const Const = require('@core/Const')
const Gpt = require('@utils/gpt.utils')


// ------ SUPPORT FUNCTION ------


async function getNumberByKvit(file) {   
    if(!file) { return null }
    const kvitBank = await getBankByKvit(file)    
    
    if(kvitBank === Const.bankList.MONO) { return await getKvitNumber(file) }
    if(kvitBank === Const.bankList.PRIVAT) { return await getPrivatKvitNumber(file) }

    return null
}

// ----- MIAI -----

async function createByNumber(invoiceId, kvitNumber) {
    if(!kvitNumber) { throw Exception.invalidValue }

    const list = await Proof.find({ invoice: invoiceId, status: {$in: Const.proof.activeStatusList} })
    if(list.length >= 2) { throw Exception.manyProofs }
    
    const number = kvitNumber.toUpperCase()

    const invoice = await Invoice.get(invoiceId)   
    if(invoice.status === Const.invoice.statusList.CONFIRM) { throw Exception.notFind }

    const payment = await Payment.softGet(invoice.payment)

    let invoiceSubstatus

    if(invoice.status === Const.invoice.statusList.VALID) {
        invoiceSubstatus = invoice.validOk? 'VALID-OK' : Const.invoice.statusList.VALID
    }
    else {
        invoiceSubstatus = invoice.status
    }

    const proof = new Proof({
        invoice: invoiceId,
        invoiceRefId: invoice.refId,
        invoicePartnerId: invoice.partnerId,
        invoiceAmount: invoice.initialAmount,
        invoiceCard: invoice.card,
        invoiceDate: invoice.createdAt,
        bank: invoice.bank,

        invoiceSubstatus,
        client: invoice.client,
        conv: invoice.conv,
        confirm: invoice.confirm,

        payment: invoice.payment,
        paymentRefId: payment.refId,
        paymentPartnerId: payment.partnerId,

        kvitNumber: number,
        kvitFile: ''
    })

    await save(proof)

    verify(proof._id).then() 
    gpt(proof._id).then()
    
    return proof
}

async function createByFile(invoiceId, kvitFile='') {
    if(!kvitFile) { throw Exception.invalidValue }

    const list = await Proof.find({ invoice: invoiceId, status: {$in: Const.proof.activeStatusList} })
    if(list.length >= 2) { throw Exception.manyProofs }

    const invoice = await Invoice.get(invoiceId)   
    if(invoice.status === Const.invoice.statusList.CONFIRM) { throw Exception.notFind }
    
    let number = await getNumberByKvit(kvitFile) 
    if(number) { number = number.toUpperCase() }

    const payment = await Payment.softGet(invoice.payment)

    let invoiceSubstatus

    if(invoice.status === Const.invoice.statusList.VALID) {
        invoiceSubstatus = invoice.validOk? 'VALID-OK' : Const.invoice.statusList.VALID
    }
    else {
        invoiceSubstatus = invoice.status
    }

    const proof = new Proof({
        invoice: invoiceId,
        invoiceRefId: invoice.refId,
        invoicePartnerId: invoice.partnerId,

        invoiceAmount: invoice.initialAmount,
        invoiceCard: invoice.card,
        invoiceDate: invoice.createdAt,
        bank: invoice.bank,

        invoiceSubstatus,
        client: invoice.client,
        conv: invoice.conv,
        confirm: invoice.confirm,

        payment: invoice.payment,
        paymentRefId: payment.refId,
        paymentPartnerId: payment.partnerId,

        kvitNumber: number,
        kvitFile
    })

    await save(proof)   

    verify(proof._id).then() 
    gpt(proof._id).then()

    return proof
}

async function verify(id) {    
    const proof = await get(id)
    if(!proof.kvitNumber) { return proof }
    
    let bank = proof.bank

    const regexMono = /\b[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}\b/
    if(regexMono.test(proof.kvitNumber)) { bank = Const.bankList.MONO } 

    const regexPrivat = /P24[A-Z0-9]{16}/
    if(regexPrivat.test(proof.kvitNumber)) { bank = Const.bankList.PRIVAT } 

    console.log(bank)

    let data = null

    proof.bank = bank
    proof.isChecking = true
    await save(proof)

    console.log('go cheking');
    
    if(bank === Const.bankList.MONO) {      
        const transaction = await CheckGov.check(proof.kvitNumber)

        if(transaction) { 
            const { card, amount, date } = transaction
            data = { kvitNumber: proof.kvitNumber, card, amount, date }
        }

    }
    if(bank === Const.bankList.PRIVAT) {              
        const transaction = await Privat.check(proof.kvitNumber)

        if(transaction) { 
            const { timestamp, card, amount } = transaction      
            data = { kvitNumber: proof.kvitNumber, card, amount, date: timestamp }
        }
    }

    proof.isChecking = false
    proof.lastCheck = !!data? 1 : -1
    await save(proof)

    console.log('stop cheking');

    return await complite(proof, data) 
}

async function complite(proof, transaction) {
    console.log('COMPLIT PROOF')
    if(!transaction) { return }
    
    proof.kvitNumber = transaction?.kvitNumber?.toUpperCase()
    proof.amount = transaction.amount
    proof.status = Const.proof.statusList.CONFIRM  

    if(transaction.card) {
        const payment = await Payment.get(proof.payment)

        if(payment.card.substring(0, 6) !== transaction.card.substring(0, 6)) { return console.log('card 6 not match') }
        if(payment.card.substring(payment.card.length - 4, payment.card.length) !== transaction.card.substring(transaction.card.length - 4, transaction.card.length)) { return console.log('card 4 not match') }
        if(transaction.date) {
            if(transaction.date - 60 * 1000 < proof.invoiceDate) { return console.log('date is not valid') }
        }
    }
    
    const saveProof = await save(proof)

    await Invoice.close(proof.invoice, proof.amount)

    return saveProof
}

async function gpt(id) {
    console.log('GPT', id)
    
    const proof = await get(id)
    const fileName = proof.kvitFile
    
    const arr = fileName.split('.')
    if(!arr.length) { return false }

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
    if(!Const.proof.activeStatusList.includes(proof.status)) { throw Exception.notFind }

    proof.status = Const.proof.statusList.REJECT

    return await save(proof)
}

async function manual(id) {    
    const proof = await get(id)
    if(!Const.proof.activeStatusList.includes(proof.status)) { throw Exception.notFind }

    if(proof.status === Const.proof.statusList.MANUAL) { proof.status = Const.proof.statusList.WAIT }
    else if(proof.status === Const.proof.statusList.WAIT) { proof.status = Const.proof.statusList.MANUAL }

    return await save(proof)
}

async function approve({id, amount, kvitNumber}) {        
    const proof = await get(id)
    if(!Const.proof.activeStatusList.includes(proof.status)) { throw Exception.notFind }

    const findKvit = kvitNumber?.toUpperCase()
    if(!findKvit) { throw Exception.invalidValue }

    const candidat = await Proof.findOne({ 
        _id: { $ne: proof._id },
        kvitNumber: findKvit, 
        status: Const.proof.statusList.CONFIRM
    })
    
    if(candidat) { throw Exception.isExist }

    return await complite(proof, { amount, kvitNumber: findKvit })
}

async function recheck(id, bank, number) {        
    const proof = await get(id)
    if(!Const.proof.activeStatusList.includes(proof.status)) { throw Exception.notFind }
    if(proof.isChecking) { throw Exception.notFind }

    proof.bank = bank
    proof.kvitNumber = number

    await save(proof)

    verify(proof._id).then() 

    return proof
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
    manual,
    recheck,

    get,
    list,
    gpt
}
