
const { Router } = require('express')
const Interceptor = require('@core/Interceptor')
const Exception = require('@core/Exception')

const Validate = require('@validate/Payment.validate')
const Serialise = require('@serialize/Payment.serialize')
const Format = require('@format/Payment.format')

const Payment = require('@controllers/Payment.controller')
const BlackList = require('@controllers/BlackList.controller')
const { Auth } = require('@middleware/auth.middleware')
const { access, partnerAccess, adminAccess } = require('@middleware/access.middleware')


const router = Router()


router.post('/create', access, partnerAccess, Validate.create, Serialise.create, 
    Interceptor(async (req, res) => {
        const isBlocked = !!(await BlackList.find(req.body.card))
        if(isBlocked) { throw Exception.cardBlocked }

        const payment = await Payment.create(req.body)

        res.status(201).json(Format.parnter(payment))
    })
)

router.post('/block', Auth, Validate.block, Serialise.block, 
    Interceptor(async (req, res) => {
        await BlackList.create(req.body.card)

        res.status(201).json(true)
    })
)

router.post('/callback',  
    Interceptor(async (req, res) => {
        const payment = await Payment.closeTail(req.body._id, req.body.amount)

        res.status(201).json(Format.admin(payment))
    })
)

router.post('/list', Auth, Validate.list, Serialise.list,
    Interceptor(async (req, res) => {
        const { filter, page, limit } = req.body

        const {list, count} = await Payment.list(filter, page, limit)        

        req.skipLog = true
        res.status(200).json({ list: list.map((payment) => Format.admin(payment)), count })
    })
)


module.exports = router
