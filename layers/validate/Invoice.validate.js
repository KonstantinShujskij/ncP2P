const { check } = require('express-validator')
const Const = require('../../core/Const')


const create = [
    check('amount', 'invalidAmount').notEmpty().isFloat({ min: Const.minInvoiceLimit, max: Const.maxInvoiceLimit }),
    check('refId', 'invalidRefId').optional().isString(),
]

const confirm = [
    check('id', 'invalidId').notEmpty().isMongoId(),
    check('kvit', 'invalidValue').optional().isString(),
]


module.exports = {
    create,
    confirm
}
