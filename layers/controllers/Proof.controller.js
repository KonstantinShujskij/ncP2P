const { getKvitNumber } = require('@utils/pdf.utils')

const Proof = require('@models/Proof.model')
const Invoice = require('@controllers/Invoice.controller')

const Exception = require('@core/Exception')
const Const = require('@core/Const')




// ------ SUPPORT FUNCTION ------

async function checkGov(number) {
    return {
        amount: 1000,
        kvitNumber: 'KVIT-009'
    }
}

async function getNumberByKvit(file, bank) {    
    if(!file) { return null }
    
    if(bank === Const.bankList.MONO) { 
        console.log(bank, file);
        
        return await getKvitNumber(file)
    }

    return null
}

// ----- MIAI -----

async function create({invoiceId, kvitNumber, kvitFile}) {
    const invoice = await Invoice.get(invoiceId)   
    
    if(invoice.status === Const.invoice.statusList.CONFIRM) { throw Exception.notFind }

    const numberInFile = await getNumberByKvit(kvitFile, invoice.bank)    
    const number = numberInFile? numberInFile : kvitNumber

    if(!number) { throw Exception.invalidValue }

    const candidat = await Proof.findOne({ number })
    if(candidat) { throw Exception.isExist }

    const proof = new Proof({
        invoice: invoiceId,
        payment: invoice.payment,
        kvitNumber: number,
        kvitFile
    })

    // then???

    await save(proof)
    
    return await verify(proof._id) 
}

async function verify(id) {
    const proof = await get(id)

    if(proof.bank === Const.bankList.MONO) {
        const transaction = await checkGov(proof.kvitNumber)
        if(transaction) { return await complite(proof, transaction) }
    }

    return proof
}

async function complite(proof, transaction) {
    console.log('COMPLITE');

    proof.kvitNumber = transaction.kvitNumber
    proof.amount = transaction.amount
    proof.status = Const.proof.statusList.CONFIRM    

    const saveProof = await save(proof)

    console.log('TO INVOICE');

    // Invoice logic
    await Invoice.close(proof.invoice, proof.amount)

    return saveProof
}

// ---------- SUPPORT ------------

async function decline(id) {
    const proof = await get(id)

    if(proof.status !== Const.proof.statusList.WAIT) { throw Exception.notFind }

    proof.status = Const.proof.statusList.REJECT

    return await save(proof)
}

async function approve({id, amount, kvitNumber}) {
    console.log('START');
    
    const proof = await get(id)

    console.log(proof);

    if(proof.status !== Const.proof.statusList.WAIT) { throw Exception.notFind }

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
    create,
    verify,

    decline,
    approve,

    get,
    list
}
