const {Schema, model, Types} = require('mongoose')

const schema = new Schema({
    name: {type: String},
    accessToken: {type: String},
    privateToken: {type: String},
    callbackUrl: {type: String},
    whiteList: [],

    paymentMinLimit: {
        default: {type: Number, default: 0},
        customLimit: {type: Number, default: 10000},
        persent: {type: Number, default: 0.05}
    }
})

module.exports = model('Partner', schema)
