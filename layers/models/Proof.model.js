const {Schema, model, Types} = require('mongoose')
const Const = require('../../core/Const')


const schema = new Schema({
    invoice: { type: Types.ObjectId, ref: 'Invoice' },
    invoiceRefId: { type: String, default: null },
    invoicePartnerId: { type: String, default: null },

    payment: { type: Types.ObjectId, ref: 'Payment' },
    paymentRefId: { type: String, default: null },
    paymentPartnerId: { type: String, default: null },

    status: { type: String, default: Const.proof.statusList.WAIT }, 
    bank: { type: String, default: '' },
    amount: { type: Number, default: 0 },
    invoiceAmount: { type: Number, default: 0 },
    invoiceCard: { type: Number, default: '' },
    invoiceDate: { type: Number, default: 0 },

    kvitNumber: { type: String, default: null },
    kvitFile: { type: String, default: null },

    gpt: {
        number: { type: String, default: null },
        amount: { type: Number, default: 0 },
        card: { type: String, default: null },
        date: { type: String, default: null },
    },

    createdAt: { type: Number },
    updatedAt: { type: Number }
}, {
    timestamps: { currentTime: () => Date.now() }
})

module.exports = model('Proof', schema)
