const Log = require('@controllers/Log.controller')


async function logger(req, res, next) {    
    const url = req.url
    const method = req.method
    const timestamp = Date.now()

    req.logs = { 
        url, 
        method, 
        time: timestamp,
        req: req.body
    }
  
    const originalSend = res.send
  
    res.send = function (body) {       
        try {
            req.logs.statusCode = res.statusCode        
            req.logs.res = JSON.parse(body)
            req.logs.time = Date.now() - req.logs.time
            req.logs.user = req.user?.login? req.user.login : null

            if(!req.skipLog) { Log.create(req.logs).then() }
        }
        catch(err) {
            console.log(err)
        }

        return originalSend.call(this, body)
    }
  
    next()
}


module.exports = logger

