
const { Router } = require('express')
const Interceptor = require('@core/Interceptor')
const Exception = require('@core/Exception')

const Validate = require('@validate/Payment.validate')
const Serialise = require('@serialize/Payment.serialize')
const Format = require('@format/Payment.format')

const Payment = require('@controllers/Payment.controller')
const BlackList = require('@controllers/BlackList.controller')


const router = Router()


router.post('/create', Validate.create, Serialise.create, 
    Interceptor(async (req, res) => {
        const isBlocked = !!(await BlackList.find(req.body.card))
        if(isBlocked) { throw Exception.cardBlocked }

        //await BlackList.create(req.body.card)

        const payment = await Payment.create(req.body)

        res.status(201).json(Format.parnter(payment))
    })
)

router.post('/list', Validate.list, Serialise.list,
    Interceptor(async (req, res) => {
        const { filter, page, limit } = req.body

        const {list, count} = await Payment.list(filter, page, limit)        

        res.status(200).json({ list: list.map((payment) => Format.admin(payment)), count })
    })
)


module.exports = router
