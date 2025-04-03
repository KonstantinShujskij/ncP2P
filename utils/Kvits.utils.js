const fetch = require('node-fetch')
const Log = require('@controllers/Log.controller')
const Const = require('@core/Const')

const config = require('config')


const check = async (type, url, number) => {
    const logs = { url, method: type, req: { number }, time: Date.now() }

    try {        
        const response = await fetch(url, {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ number })
        })

        const data = await response.json()
        console.log(data)        

        logs.res = JSON.parse(data)   
        logs.time = Date.now() - logs.time
        logs.statusCode = (data && data.card && data.amount)? 200 : 'Have not data'

        await Log.create(logs)

        return data
    } 
    catch (error) {   
        console.log(error)
        
        logs.statusCode = 'Not have Responce' 
        logs.time = Date.now() - logs.time

        await Log.create(logs)

        return null
    }
}

const checkMono = async (number) => await check(Const.bankList.MONO, `${config.get('checkGovUrl')}/check`, number)
const checkPrivat = async (number) => await check(Const.bankList.PRIVAT, `${config.get('privatUrl')}/check`, number)

const checkByBank = async (bank, number) => {
    if(bank === Const.bankList.MONO) { return await checkMono(number) }
    if(bank === Const.bankList.PRIVAT) { return await checkPrivat(number) }

    return null 
}

module.exports = { 
    checkMono,
    checkPrivat,
    checkByBank
}