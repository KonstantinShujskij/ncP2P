
const { Router } = require('express')
const Interceptor = require('@core/Interceptor')

const Validate = require('@validate/Proof.validate')
const Serialise = require('@serialize/Proof.serialize')
const Proof = require('@controllers/Proof.controller')
const Format = require('@format/Proof.format')

const file = require('@middleware/file.middleware')


const router = Router()


router.post('/create', file.single('kvit'),  Validate.create, Serialise.create, 
    Interceptor(async (req, res) => {
        const proof = await Proof.create(req.body)

        res.status(201).json(Format.client(proof))
    })
)

router.post('/list', Validate.list, Serialise.list,
    Interceptor(async (req, res) => {
        const { filter, page, limit } = req.body     
        
        console.log(filter);
        

        const {list, count} = await Proof.list(filter, page, limit)        

        res.status(200).json({ list: list.map((proof) => Format.admin(proof)), count })
    })
)


module.exports = router
