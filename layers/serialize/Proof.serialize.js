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

const decline = (req, _, next) => {   
    req.body = { 
        id: toObjectId(req.body.id)
    }

    next()
}

const approve = (req, _, next) => {   
    try {
        req.body = { 
            id: toObjectId(req.body.id),
            kvitNumber: req.body.kvitNumber,
            amount: req.body.amount,
        }
    }
    catch(error) {
        console.log(error)
    }

    console.log('EBD APPROVE');
    
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
    decline,
    approve,
    list
}
