
const parnter = (payment) => ({
    id: payment._id,
    refId: payment.refId || '',
    partnerId: payment.partnerId || '',

    card: payment.card,
    amount: payment.amount,
    status: payment.status,

    createdAt: payment.createdAt
})

const admin = (payment) => ({
    id: payment._id,
    refId: payment.refId || '',
    partnerId: payment.partnerId || '',
    isFreeze: payment.isFreeze,
    isTail: payment.isTail,

    card: payment.card,
    amount: payment.amount,
    initialAmount: payment.initialAmount,
    currentAmount: payment.currentAmount,

    status: payment.status,

    isOneWait: payment.isOneWait,
    isOneValid: payment.isOneValid,
    isAllValidOk: payment.isAllValidOk,
    priority: payment.priority,
    
    createdAt: payment.createdAt
})


module.exports = {
    all: (payment) => payment,
    parnter,
    admin
}
