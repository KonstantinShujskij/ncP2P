

const create = (req, _, next) => {   
    req.body = { 
        card: req.body.card, 
        amount: req.body.amount,
        refId: req.body.refId || ''
    }

    next()
}


module.exports = {
    create
}
