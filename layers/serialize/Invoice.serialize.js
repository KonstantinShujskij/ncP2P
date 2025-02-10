const Filter = require('@filter/Invoice.filters')

const { getKvitNumber } = require('@utils/pdf.utils')
const { toObjectId } = require('@utils/utils')


const create = (req, _, next) => {   
    req.body = { 
        amount: req.body.amount,
        refId: req.body.refId || '',
        partnerId: req.body.partnerId || '',
        bank: req.body.partnerId || null
    }

    next()
}

const confirm = async (req, _, next) => {   
    const number = req.file?.filename?  await getKvitNumber(req.file?.filename) : req.body.kvitNumber

    req.body = { 
        id: toObjectId(req.body.id),
        kvitFile: req.file?.filename || null,
        kvitNumber: number || null,
    }

    next()
}

const list = (req, _, next) => {   
    req.body = { 
        filter: Filter.admin(req.body.filter), 
        page: req.body.page,
        limit: req.body.limit
    }

    next()
}


module.exports = {
    create,
    confirm,
    list
}
