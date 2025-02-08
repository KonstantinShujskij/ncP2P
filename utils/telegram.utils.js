const https = require('https')
const jwt = require('jsonwebtoken')
const config = require('config')

const Exception = require('@core/Exception')


function sendMessage(telegram, text, botToken=config.get('botToken')) {
    try {
        https.get(`https://api.telegram.org/bot${botToken}/sendMessage?chat_id=${telegram}&text=${text}&parse_mode=html`)
        return true
    }
    catch(error) {
        return false
    }
}

function sendAuth(telegram, auth) {
    const text = `Access Token: <code>${auth.accessToken}</code>%0APrivate Token: <code>${auth.privateToken}</code>`

    return sendMessage(telegram, text)
}

function sendCode(telegram) {
    const code = 100000 + parseInt(Math.random() * 900000)

    sendMessage(telegram, `<code>${code}</code>`)

    const secret = config.get('authSecret')
    const token = jwt.sign({ telegram, code }, secret, { expiresIn: '5m' })

    return token
}

function verify(token, telegram, code) {
    const secret = config.get('authSecret')
    const decoded = jwt.verify(token, secret)
    
    if(decoded.code.toString() !== code) { throw Exception.notAuth }
    if(decoded.telegram !== telegram.toString()) { throw Exception.notAuth }
}


module.exports = { 
    sendMessage,
    sendAuth,
    sendCode,
    verify,
}