const Filter = require('@filter/Proof.filters')

const { toObjectId } = require('@utils/utils')


const create = (req, _, next) => {   
    req.body = { 
        invoiceId: toObjectId(req.body.invoice),
        kvitFile: req.file?.filename || null,
        kvitNumber: req.body.kvitNumber || null,
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
    list
}
