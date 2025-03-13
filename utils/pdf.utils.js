const pdf = require('pdf-parse')
const path = require('path')
const fs = require('fs')
const Const = require('@core/Const')


const getKvitNumber = async (fileName) => {
    try {        
        const text = await getKvitText(fileName)

        const regex = /\b[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}\b/
        const match = text.match(regex)

        if(match) { return match[0] } 
        else { return null }
    } 
    catch (e) { return null }
}

const getPrivatKvitNumber = async (fileName) => {
    try {        
        const text = await getKvitText(fileName)
        
        const regex = /P24[A-Z0-9]{16}/
        const match = text.match(regex)     
                
        if(match) { return match[0] } 
        else { return null }
    } 
    catch (e) { return null }
}

const getBankByKvit = async (fileName) => {
    try {        
        const text = await getKvitText(fileName)

        if(text.indexOf('Телефон: 0 800 205 205') !== -1) { return Const.bankList.MONO }
        if(text.indexOf('Тел.: 3700') !== -1) { return Const.bankList.PRIVAT }
    } 
    catch (e) { return null }
}

const getKvitText = async (fileName) => {
    try {        
        const filePath = path.join(__dirname, `../static/kvits/${fileName}`)
        if(!fs.existsSync(filePath)) { return null }

        let dataBuffer = fs.readFileSync(filePath)

        const data = await pdf(dataBuffer)
        return data.text
    } 
    catch (e) { return null }
}


module.exports = {
    getKvitNumber,
    getPrivatKvitNumber,
    getKvitText,
    getBankByKvit
}
