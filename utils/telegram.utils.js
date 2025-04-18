const jwt = require('jsonwebtoken')
const https = require('https')

const Exception = require('@core/Exception')
const config = require('config')


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

function cantNcApiMake(payment, telegram=config.get('adminGroupe')) {
    const text = `Cant make payment in NcApi. id: ${payment}`
    sendMessage(telegram, text)
}

function clientHasActive(invoice, telegram=config.get('adminGroupe')) {
    let text = `Error: Client have active invoice: %0A`
    text += `Id: <code>${invoice._id}</code> %0A`
    text += `Client: <code>${invoice.client}</code> %0A`
    text += `Amount: <code>${invoice.amount}</code> %0A`

    sendMessage(telegram, text)
}

function cantSendCallback(invoice, telegram=config.get('adminGroupe')) {
    const text = `Cant send payment callback to NcPay. id: ${invoice}`
    sendMessage(telegram, text)
}

function moreAmount(invoice, amount, telegram=config.get('adminGroupe')) {
    const text = `Invoice - ${invoice._id} with amount - ${invoice.amount}, will be closed - ${amount}`
    sendMessage(telegram, text)
}

function sendCode(telegram) {
    const code = 100000 + parseInt(Math.random() * 900000)

    sendMessage(telegram, `<code>${code}</code>`)

    const secret = config.get('authSecret')
    const token = jwt.sign({ telegram, code }, secret, { expiresIn: '5m' })

    return token
}

function sendProofs(proofs, telegram) {    
    proofs.forEach((proof) => {        
        let text = ''
        text += `Payment: <code>${proof.payment}</code> %0A`
        text += `Invoice: <code>${proof.invoice}</code> %0A`
        text += `Proof: <code>${proof.proof}</code> %0A`
        text += `${proof.link}`

        sendMessage(telegram, text)
    })
}

module.exports = { 
    sendMessage,
    sendAuth,
    sendCode,
    verify,

    cantNcApiMake,
    cantSendCallback,
    clientHasActive,
    moreAmount,
    sendProofs
}