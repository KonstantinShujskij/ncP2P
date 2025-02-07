
const { Router } = require('express')
const Interceptor = require('@core/Interceptor')

const Validate = require('@validate/Invoice.validate')
const Serialise = require('@serialize/Invoice.serialize')
const Invoice = require('@controllers/Invoice.controller')
const Format = require('@format/Invoice.format')

const file = require('@middleware/file.middleware')


const router = Router()


router.post('/create', Validate.create, Serialise.create, 
    Interceptor(async (req, res) => {
        const invoice = await Invoice.create(req.body)

        res.status(201).json(Format.parnter(invoice))
    })
)

router.post('/approve', file.single('kvit'), Validate.confirm, Serialise.confirm,
    Interceptor(async (req, res) => {
        const invoice = await Invoice.approve(req.body)

        res.status(200).json(Format.parnter(invoice))
    })
)


module.exports = router
