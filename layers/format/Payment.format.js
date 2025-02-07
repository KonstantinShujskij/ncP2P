
const parnter = (payment) => ({
    id: payment._id,
    refId: payment.refId || '',
    amount: payment.amount,
    status: payment.status,
    createdAt: payment.createdAt
})


module.exports = {
    all: (payment) => payment,
    parnter
}
