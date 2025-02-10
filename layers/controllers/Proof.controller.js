const bcrypt = require('bcrypt')
const telegram = require('@utils/telegram.utils')

const Proof = require('@models/Proof.model')
const Invoice = require('@controllers/Invoice.controller')

const Exception = require('@core/Exception')
const Const = require('@core/Const')




// ------ SUPPORT FUNCTION ------

async function checkGov(number) {
    return {
        amount: 1000,
    }
}

async function getNumberByKvit(file, bank) {
    if(!file) { return null }

    if(bank === Const.bankList.MONO) { 
        // Mono parser
        return 'Mono Kvit Number'
    }

    return null
}

// ----- MIAI -----

async function create({invoiceId, kvitNumber, kvitFile}) {
    const invoice = await Invoice.get(invoiceId) 

    const numberInFile = await getNumberByKvit(kvitFile, invoice.bank)
    const number = numberInFile? numberInFile : kvitNumber

    const candidat = await Proof.findOne({ number })
    if(candidat) { throw Exception.isExist }

    const proof = new Proof({
        invoice: invoiceId,
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
    proof.amount = transaction.amount
    proof.status = Const.proof.statusList.CONFIRM

    const saveProof = await save(proof)

    // Invoice logic

    return saveProof
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

    get,
    list
}
