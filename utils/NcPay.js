const request = require('request')


const callback = (invoice, handler=()=>{}) => {
    const url = config.get('NcPayUrl') + '/ncp2p/callback'
    const options = { url, headers: { "content-type": "application/json" }, body: invoice, json: true }
    
    request.post(options, (error, res) => handler(res))
}

module.exports = { 
    callback
}