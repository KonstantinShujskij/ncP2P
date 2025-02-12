
const { Router } = require('express')
const Interceptor = require('@core/Interceptor')

const Validate = require('@validate/Proof.validate')
const Serialise = require('@serialize/Proof.serialize')
const Proof = require('@controllers/Proof.controller')
const Format = require('@format/Proof.format')
const Jwt = require('@utils/Jwt.utils')

const file = require('@middleware/file.middleware')
const { Auth } = require('@middleware/auth.middleware')


const router = Router()


router.post('/create', file.single('kvit'), Validate.create, Serialise.create, 
    Interceptor(async (req, res) => {
        const proof = await Proof.create(req.body)

        res.status(201).json(Format.client(proof))
    })
)

router.post('/create-client', file.single('kvit'), Validate.client, Serialise.client, 
    Interceptor(async (req, res) => {        
        req.body.invoiceId = Jwt.validateLinkJwt(req.body.hash)
        
        const proof = await Proof.create(req.body)

        res.status(201).json(Format.client(proof))
    })
)

router.post('/decline', Auth, Validate.decline, Serialise.decline, 
    Interceptor(async (req, res) => {
        const proof = await Proof.decline(req.body.id)

        res.status(200).json(Format.admin(proof))
    })
)

router.post('/accept', Auth, Validate.approve, Serialise.approve,
    Interceptor(async (req, res) => {
        const proof = await Proof.approve(req.body)        

        res.status(200).json(Format.admin(proof))
    })
)

router.post('/list', Auth, Validate.list, Serialise.list,
    Interceptor(async (req, res) => {
        const { filter, page, limit } = req.body             

        const {list, count} = await Proof.list(filter, page, limit)        

        req.skipLog = true
        res.status(200).json({ list: list.map((proof) => Format.admin(proof)), count })
    })
)


module.exports = router
