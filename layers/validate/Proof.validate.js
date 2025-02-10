const { check } = require('express-validator')
const Const = require('../../core/Const')


const create = [
    check('invoice', 'invalidValue').notEmpty().isMongoId(),
    check('kvitNumber', 'invalidValue').optional().isString(),
]

const list = [
    check('filter', 'invalidValue').optional().isObject(),
    check('page', 'invalidValue').notEmpty().isInt({ min: 0 }),
    check('limit', 'invalidValue').notEmpty().isInt({ min: 0 }),
]


module.exports = {
    create,
    list
}
