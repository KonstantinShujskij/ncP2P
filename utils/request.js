const { createHmac } = require('node:crypto')
const config = require('config')
const request = require('request')


const generateSignature = (body, privateToken) => {  
    const json = JSON.stringify(body)
    const hash = createHmac('sha256', privateToken).update(json).digest('hex')

    return hash
}

const protectedRecuest = (url, body, handler=()=>{}) => {    
    const accessToken = config.get('accessToken')
    const privateToken = config.get('privateToken')

    body = {accessToken, ...body}
    body.signature = generateSignature(body, privateToken)

    const options = { url, headers: { "content-type": "application/json" }, body, json: true }
    
    request.post(options, (error, res) => handler(res))
}

module.exports = { 
    protectedRecuest
}