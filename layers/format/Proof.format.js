
const admin = (proof) => ({
    id: proof._id,
    invoice: proof.invoice,
    bank: proof.bank,
    amount: proof.amount,
    kvitNumber: proof.kvitNumber,
    kvitFile: proof.kvitFile,
    createdAt: proof.createdAt
})

const partner = (proof) => ({
    id: proof._id,
    invoice: proof.invoice,
    bank: proof.bank,
    amount: proof.amount,
    kvitNumber: proof.kvitNumber,
    kvitFile: proof.kvitFile,
    createdAt: proof.createdAt
})

const client = (proof) => ({
    id: proof._id,
    invoice: proof.invoice,
    bank: proof.bank,
    amount: proof.amount,
    kvitNumber: proof.kvitNumber,
    kvitFile: proof.kvitFile,
    createdAt: proof.createdAt
})


module.exports = {
    all: (proof) => proof,
    admin,
    partner,
    client
}
