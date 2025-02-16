const { protectedRecuest } = require('./request')
const config = require('config')
const { cantNcApiMake } = require('./telegram.utils')


const makeSubscribe = (callbackUrl=`${config.get('serverUrl')}/api/payment/callback`, callback=()=>{}) => {
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
    try {
        const url = config.get('NcApiUrl') + '/order/create'
        
        const body = { maker: config.get('maker'), currency: 'uah', card, value, referenceId }
        
        protectedRecuest(url, body, callback)
    }
    catch(err) {
        console.log(err);
        
        cantNcApiMake(referenceId)
    }
}

module.exports = { 
    makeSubscribe,
    makeOrder
}