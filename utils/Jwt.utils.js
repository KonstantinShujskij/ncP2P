const jwt = require('jsonwebtoken')

const Exception = require('../core/Exception')
const config = require('config')


const getToken = (data, expiresIn='24h') => jwt.sign(data, config.get('jwtSecret'), { expiresIn }) 


module.exports = { 
    getToken
}
