const {Schema, model, Types} = require('mongoose')
const Const = require('../../core/Const')


const schema = new Schema({
    invoice: { type: Types.ObjectId, ref: 'Invoice' },
    status: { type: String, default: Const.proof.statusList.WAIT }, 
    bank: { type: String, default: '' },
    amount: { type: Number, default: 0 },

    kvitNumber: { type: String, default: null },
    kvitFile: { type: String, default: null },

    createdAt: { type: Number },
    updatedAt: { type: Number }
}, {
    timestamps: { currentTime: () => Date.now() }
})

module.exports = model('Proof', schema)
