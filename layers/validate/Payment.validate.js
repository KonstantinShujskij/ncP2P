const { check } = require('express-validator')
const Const = require('../../core/Const')


const create = [
    check('card', 'invalidCard').notEmpty().isCreditCard(),
    check('amount', 'invalidAmount').notEmpty().isFloat({ min: Const.minPaymentLimit, max: Const.maxPaymentLimit }),
    check('refId', 'invalidRefId').optional().isString(),
]


module.exports = {
    create
}
