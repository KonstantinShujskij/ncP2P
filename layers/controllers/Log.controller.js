const Log = require('@models/Log.model')

const Const = require('@core/Const')
const Exception = require('@core/Exception')


async function create(data={}) {
    const log = new Log(data)    
    
    return await save(log) 
}

async function getAutoStatistic(user, timestart=0, timestop=Infinity) {  
    const options = { createdAt: { $gt: timestart, $lt: timestop } }

    const dataMono = await Invoice.aggregate([
        { $match: { ...options, method: Const.bankList.MONO }},
        { $group: {
            _id: null,
            count: { $sum: 1 },
            countConfirm: { $sum: { $cond: { if: { $eq: ['$statusCode', "200"] }, then: 1, else: 0 }}},
        }},
        { $project: {
            count: 1,
            countConfirm: 1,
            conversion: { $divide: [ "$countConfirm", "$count" ] },
        }}
    ]) 

    const dataPrivat = await Invoice.aggregate([
        { $match: { ...options, method: Const.bankList.MONO }},
        { $group: {
            _id: null,
            count: { $sum: 1 },
            countConfirm: { $sum: { $cond: { if: { $eq: ['$statusCode', "200"] }, then: 1, else: 0 }}},
        }},
        { $project: {
            count: 1,
            countConfirm: 1,
            conversion: { $divide: [ "$countConfirm", "$count" ] },
        }}
    ]) 
    
    console.log(dataMono)
    console.log(dataPrivat)
   
    return {
        mono: dataMono,
        privat: dataPrivat
    }
}

async function save(log) {
    try { return await log.save() }
    catch(e) { throw Exception.notCanSaveModel }
}

async function get(_id) {
    const log = await Log.findOne({ _id })
    if(!log) { throw Exception.notFind }

    return log
}


module.exports = { 
    create,
    getAutoStatistic,
     
    get
}
