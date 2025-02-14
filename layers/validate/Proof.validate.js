const { check } = require('express-validator')
const Const = require('../../core/Const')


const create = [
    check('invoice', 'invalidValue').notEmpty().isMongoId(),
    check('kvitNumber', 'invalidValue').optional().isString(),
]


const client = [
    check('hash', 'invalidId').notEmpty().isString(),
    check('kvitNumber', 'invalidValue').optional().isString(),
]

const decline = [
    check('id', 'invalidValue').notEmpty().isMongoId(),
]

const approve = [
    // check('id', 'invalidValue').notEmpty().isMongoId(),
    check('amount', 'invalidValue').notEmpty().isInt({ min: 0 }),
    check('kvitNumber', 'invalidValue').notEmpty().isString(),
]

const list = [
    check('filter', 'invalidValue').optional().isObject(),
    check('page', 'invalidValue').notEmpty().isInt({ min: 0 }),
    check('limit', 'invalidValue').notEmpty().isInt({ min: 0 }),
]


module.exports = {
    create,
    client,
    decline,
    approve,
    list
}
