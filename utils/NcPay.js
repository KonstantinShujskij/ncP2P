const request = require('request')
const { cantSendCallback } = require('./telegram.utils')


const callback = (invoice, handler=()=>{}) => {
    try {
        const url = config.get('NcPayUrl') + '/ncp2p/callback'
        const options = { url, headers: { "content-type": "application/json" }, body: invoice, json: true }
        
        request.post(options, (error, res) => handler(res))
    }
    catch(err) {
        cantSendCallback(invoice.id)
    }
}

module.exports = { 
    callback
}