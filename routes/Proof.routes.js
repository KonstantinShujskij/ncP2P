
const { Router } = require('express')
const Interceptor = require('@core/Interceptor')

const Validate = require('@validate/Proof.validate')
const Serialise = require('@serialize/Proof.serialize')
const Proof = require('@controllers/Proof.controller')
const Format = require('@format/Proof.format')

const file = require('@middleware/file.middleware')


const router = Router()


router.post('/create', file.single('kvit'), Validate.create, Serialise.create, 
    Interceptor(async (req, res) => {
        const proof = await Proof.create(req.body)

        res.status(201).json(Format.client(proof))
    })
)

router.post('/decline', Validate.decline, Serialise.decline, 
    Interceptor(async (req, res) => {
        const proof = await Proof.decline(req.body.id)

        res.status(200).json(Format.admin(proof))
    })
)

router.post('/accept', Validate.approve, Serialise.approve,
    Interceptor(async (req, res) => {
        const proof = await Proof.approve(req.body)        

        res.status(200).json(Format.admin(proof))
    })
)

router.post('/list', Validate.list, Serialise.list,
    Interceptor(async (req, res) => {
        const { filter, page, limit } = req.body             

        const {list, count} = await Proof.list(filter, page, limit)        

        req.skipLog = true
        res.status(200).json({ list: list.map((proof) => Format.admin(proof)), count })
    })
)


module.exports = router
