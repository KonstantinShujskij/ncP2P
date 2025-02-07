const {Schema, model, Types} = require('mongoose')
const Const = require('../../core/Const')


const schema = new Schema({
    refId: { type: String, default: '' },
    initialAmount: { type: Number },
    availableAmount: { type: Number },
    amount: { type: Number },

    payment: { type: Types.ObjectId, ref: 'Payment' },
    status: { type: String, default: Const.invoice.statusList.WAIT }, 
    kvitNumber: { type: String, default: null },
    kvitFile: { type: String, default: null },

    createdAt: { type: Number },
    updatedAt: { type: Number }
}, {
    timestamps: { currentTime: () => Date.now() }
})

module.exports = model('Invoice', schema)
