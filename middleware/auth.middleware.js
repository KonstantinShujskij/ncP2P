const jwt = require('jsonwebtoken')

const User = require('@controllers/User.controller')
const middleware = require('@core/Middleware')
const Exception = require('@core/Exception')
const Const = require('@core/Const')

const config = require('config')


const Auth = middleware(async (req, res) => {   
    const token = req.headers.authorization.split(' ')[1]
    if(!token) { throw Exception.notAuth }

    try { 
        req.user = jwt.verify(token, config.get('authSecret')) 
        req.user = await User.get(req.user?._id)
    } 
    catch(error) { throw Exception.notAuth }
})

const isAdmin =  middleware(async (req, res) => {
    if(req.user.access !== Const.userAccess.ADMIN) { throw errors.notAuth }
})

const isMaker =  middleware(async (req, res) => {
    if(req.user.access !== Const.userAccess.ADMIN && req.user.access !== Const.userAccess.MAKER) { throw errors.notAuth }
})

const isSupport =  middleware(async (req, res) => {
    if(req.user.access !== Const.userAccess.ADMIN && req.user.access !== Const.userAccess.SUPPORT) { throw errors.notAuth }
})


module.exports = { Auth, isAdmin, isMaker, isSupport }
