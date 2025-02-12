
const { Router } = require('express')
const Interceptor = require('@core/Interceptor')

const Validate = require('@validate/Invoice.validate')
const Serialise = require('@serialize/Invoice.serialize')
const Invoice = require('@controllers/Invoice.controller')
const Format = require('@format/Invoice.format')

const { Auth } = require('@middleware/auth.middleware')
const { access, partnerAccess } = require('@middleware/access.middleware')
const Jwt = require('@utils/Jwt.utils')
const config = require('config')

const router = Router()


router.post('/create', access, partnerAccess, Validate.create, Serialise.create, 
    Interceptor(async (req, res) => {
        const invoice = await Invoice.create(req.body)
        const hash = Jwt.generateLinkJwt(invoice._id)

        const payPageUrl = config.get('payPageUrl')
        res.status(201).json({...Format.parnter(invoice), link: `${payPageUrl}?hash=${hash}`})
    })
)

router.post('/pay', Validate.get, Serialise.get,
    Interceptor(async (req, res) => {
        const id = Jwt.validateLinkJwt(req.body.hash)

        const invoice = await Invoice.pay(id)

        res.status(200).json(Format.parnter(invoice))
    })
)

router.post('/get', Validate.get, Serialise.get,
    Interceptor(async (req, res) => {
        const id = Jwt.validateLinkJwt(req.body.hash)

        const invoice = await Invoice.get(id)        

        res.status(200).json(Format.client(invoice))
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
