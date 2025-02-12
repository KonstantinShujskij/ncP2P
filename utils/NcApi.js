const { protectedRecuest } = require('./request')
const config = require('config')


const makeSubscribe = (callbackUrl=`${config.get('serverUrl')}/api/payment/callback`, callback=()=>{}) => {
    //callbackUrl = 'http://ncpay.tech:5555/api/callback'

    try {
        const url = config.get('NcApiUrl') + '/subscribe/on'
        const body = { url: callbackUrl }

        protectedRecuest(url, body, callback)
    }
    catch(err) {
        console.log(err);
    }
}

const makeOrder = (card, value, referenceId, callback=()=>{}) => {
    const currency = 'uah'
    const maker = config.get('maker')

    try {
        const url = config.get('NcApiUrl') + '/order/create'
        const body = { maker, currency, card, value, referenceId }

        protectedRecuest(url, body, callback)
    }
    catch(err) {
        console.log(err);
    }
}

module.exports = { 
    makeSubscribe,
    makeOrder
}