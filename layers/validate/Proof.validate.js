const { check } = require('express-validator')
const Const = require('../../core/Const')


const create = [
    check('invoice', 'invalidValue').notEmpty().isMongoId(),
    check('kvitNumber', 'invalidValue').optional().isString(),
]


const clientNumber = [
    check('hash', 'invalidId').notEmpty().isString(),
    check('kvitNumber', 'invalidValue').notEmpty().isString(),
]

const clientFile = [
    check('hash', 'invalidId').notEmpty().isString(),
]

const get = [
    check('id', 'invalidValue').notEmpty().isMongoId(),
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

const recheck = [
    check('id', 'invalidValue').notEmpty().isMongoId(),
    check('bank', 'invalidBank').optional().isString(),
    check('number', 'invalidValue').notEmpty().isString().isLength({ min: 1 })
]


module.exports = {
    create,
    clientNumber,
    clientFile,
    decline,
    approve,
    recheck,
    list,
    get
}
