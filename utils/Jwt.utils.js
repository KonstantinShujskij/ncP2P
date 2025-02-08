const jwt = require('jsonwebtoken')

const config = require('config')


const generateLoginJwt = (id) => { 
    const secret = config.get('authSecret')

    return jwt.sign({ _id: id }, secret, { expiresIn: '24h' }) 
}


module.exports = { 
    generateLoginJwt
}
