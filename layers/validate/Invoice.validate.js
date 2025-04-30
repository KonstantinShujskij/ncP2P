const { check } = require('express-validator')
const Const = require('../../core/Const')


const create = [
    check('amount', 'invalidAmount').notEmpty().isFloat({ min: Const.minInvoiceLimit, max: Const.maxInvoiceLimit }),
    check('refId', 'invalidRefId').optional().isString(),
    check('partnerfId', 'invalidPartnerId').optional().isString(),
    check('bank', 'invalidBank').optional().isString(),
    check('client', 'invalidBank').notEmpty().isString(),
]

const pay = [
    check('hash', 'invalidId').notEmpty().isString(),
]

const get = [
    check('id', 'invalidId').notEmpty().isMongoId(),
]

const change = [
    check('id', 'invalidId').notEmpty().isMongoId(),
    check('amount', 'invalidAmount').notEmpty().isFloat({ min: 0 })
]

const list = [
    check('filter', 'invalidValue').optional().isObject(),
    check('page', 'invalidValue').notEmpty().isInt({ min: 0 }),
    check('limit', 'invalidValue').notEmpty().isInt({ min: 0 }),
]


module.exports = {
    create,
    pay,
    get,
    change,
    list
}
