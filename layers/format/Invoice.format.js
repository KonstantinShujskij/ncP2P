
const parnter = (invoice) => ({
    id: invoice._id,
    refId: invoice.refId || '',
    amount: invoice.amount,
    status: invoice.status,

    kvit: invoice.kvitFile,
    kvitNumber: invoice.kvitNumber,

    createdAt: invoice.createdAt,
})



module.exports = {
    all: (user) => user,
    parnter
}
