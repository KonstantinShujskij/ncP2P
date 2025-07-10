const {Schema, model, Types} = require('mongoose')
const Const = require('@core/Const')


const schema = new Schema({
    author: { type: String, default: '' },
    accessId: { type: Types.ObjectId, ref: 'Partner' },
    accessName: { type: String, default: '' },

    refId: { type: String, default: '' },
    partnerId: { type: String, default: '' },
    tailId: { type: String, default: null },
    
    card: { type: String },
    amount: { type: Number },
    course: { type: Number, default: 0 },
    
    initialAmount: { type: Number },
    currentAmount: { type: Number },
    tailAmount: { type: Number, default: 0 },

    tails: [ { type: Object, ref: 'Tail' } ],

    minLimit: { type: Number, default: Const.minPaymentLimit },
    maxLimit: { type: Number },

    status: { type: String, default: Const.payment.statusList.ACTIVE }, // ACTIVE / BLOCKED / SUCCESS

    isOneWait: { type: Boolean, default: false },
    isOneValid: { type: Boolean, default: false },
    isAllValidOk: { type: Boolean, default: false },

    isWait: { type: Boolean, default: false },
    isRefresh: { type: Boolean, default: true },
    isTail: { type: Boolean, default: false },
    isFreeze: { type: Boolean, default: false },
    priority: { type: Boolean, default: false },

    filter: {
        type: { type: String, default: Const.payment.filter.types.DEFAULT },
        conv: { type: Number, default: -1 },
        confirm: { type: Number, default: -1 },
        round: { type: Number, default: 1 }
    },

    createdAt: { type: Number },
    updatedAt: { type: Number }
}, {
    timestamps: { currentTime: () => Date.now() }
})

module.exports = model('Payment', schema)
