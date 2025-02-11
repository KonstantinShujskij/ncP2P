
const { Router } = require('express')
const Interceptor = require('@core/Interceptor')

const Validate = require('@validate/Invoice.validate')
const Serialise = require('@serialize/Invoice.serialize')
const Invoice = require('@controllers/Invoice.controller')
const Format = require('@format/Invoice.format')

const file = require('@middleware/file.middleware')
const { Auth } = require('@middleware/auth.middleware')


const router = Router()


router.post('/create', Validate.create, Serialise.create, 
    Interceptor(async (req, res) => {
        const invoice = await Invoice.create(req.body)

        res.status(201).json(Format.parnter(invoice))
    })
)

router.post('/pay', Validate.pay, Serialise.pay,
    Interceptor(async (req, res) => {
        const invoice = await Invoice.pay(req.body.id)

        res.status(200).json(Format.parnter(invoice))
    })
)

router.post('/list', Auth, Validate.list, Serialise.list,
    Interceptor(async (req, res) => {
        const { filter, page, limit } = req.body        

        const {list, count} = await Invoice.list(filter, page, limit)        

        req.skipLog = true
        res.status(200).json({ list: list.map((payment) => Format.admin(payment)), count })
    })
)


module.exports = router
