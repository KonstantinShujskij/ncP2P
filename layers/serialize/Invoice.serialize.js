const Filter = require('@filter/Invoice.filters')

const { getKvitNumber } = require('@utils/pdf.utils')
const { toObjectId } = require('@utils/utils')


const create = (req, _, next) => {   
    req.body = { 
        amount: req.body.amount,
        refId: req.body.refId || '',
        partnerId: req.body.partnerId || '',
        bank: req.body.bank || null
    }

    next()
}

const pay = async (req, _, next) => {   
    req.body = { 
        id: toObjectId(req.body.id),
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
    pay,
    list
}
