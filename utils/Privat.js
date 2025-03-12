const fetch = require('node-fetch')

const config = require('config')


const check = async (number, handler) => {
    const url = `${config.get('privatUrl')}/check`
    const body = { number }

    try {
        console.log('--- Request to check privat:', body)
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        })

        return await response.json()
    } 
    catch (error) {
        console.log('--- Privat Error', error)
        
        return null
    }
}


module.exports = { 
    check
}