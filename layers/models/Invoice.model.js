const {Schema, model, Types} = require('mongoose')
const Const = require('../../core/Const')


const schema = new Schema({
    refId: { type: String, default: '' },
    partnerId: { type: String, default: '' },
    
    initialAmount: { type: Number },
    availableAmount: { type: Number },
    amount: { type: Number },

    status: { type: String, default: Const.invoice.statusList.WAIT }, 
    validOk: { type: Boolean, default: false }, 
    payment: { type: Types.ObjectId, ref: 'Payment' },
    paymentRefId: { type: String, default: null },
    paymentPartnerId: { type: String, default: null },
    
    card: { type: String },
    bank: { type: String, default: null },
    client: { type: String, default: null },
    conv: { type: Number, default: -1 },
    confirm: { type: Number, default: -1 },

    kvitNumber: { type: String, default: null },
    kvitFile: { type: String, default: null },
    payLink: { type: String, default: null },

    createdAt: { type: Number },
    updatedAt: { type: Number }
}, {
    timestamps: { currentTime: () => Date.now() }
})

module.exports = model('Invoice', schema)
