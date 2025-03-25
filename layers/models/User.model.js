const {Schema, model, Types} = require('mongoose')
const Const = require('@core/Const')


const schema = new Schema({
    login: {type: String},
    password: {type: String},
    telegram: {type: String},
    access: { type: String, default: Const.userAccess.SUPPORT }, 
    accessId: { type: Types.ObjectId, ref: 'Partner' },

    twoFA: {type: String, default: ''}
})


module.exports = model('User', schema)
