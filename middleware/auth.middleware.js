const jwt = require('jsonwebtoken')

const User = require('../layers/controllers/User.controller')
const Exception = require('../core/Exception')
const Const = require('../core/Const')

const config = require('config')


const middleware = require('../core/Middleware')


const Auth = middleware((req, res) => {   
    const token = req.headers.authorization.split(' ')[1]
    if(!token) { throw Exception.notAuth }

    try { req.user = jwt.verify(token, config.get('jwtSecret')) } 
    catch(error) { throw Exception.notAuth }
})


const isUser = middleware(async (req, res) => req.user = await User.get(req?.user?._id))

const isAdmin = middleware(async (req, res) => {
    if(req?.user?.access !== Const.user.access.Admin) { throw Exception.notAccess }
})


module.exports = { Auth, isUser, isAdmin }
