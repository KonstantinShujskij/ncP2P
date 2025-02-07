require('module-alias/register')

const mongoose = require('mongoose')
const express = require('express')
// const http = require('http')
// const https = require('https')

const config = require('config')


const app = express()

const PORT = config.get('port')
const SLL_PORT = config.get('sslPort')
const MONGO_URL = config.get('mongoUri')

app.use(express.json({ extended: true }))
app.use('/api/payment', require('./routes/Payment.routes'))
app.use('/api/invoice', require('./routes/Invoice.routes'))
 

async function start() {
    await mongoose.connect(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })

    if(process.env.NODE_ENV !== 'production') { 
        return app.listen(PORT, () => console.log(`Dev-App has been started on port ${PORT}`))
    }

    // const privateKey = fs.readFileSync('/etc/letsencrypt/live/ncpay.tech/privkey.pem', 'utf8');
    // const certificate = fs.readFileSync('/etc/letsencrypt/live/ncpay.tech/cert.pem', 'utf8');
    // const ca = fs.readFileSync('/etc/letsencrypt/live/ncpay.tech/chain.pem', 'utf8');

    // const credentials = { key: privateKey, cert: certificate, ca: ca }

    // const httpServer = http.createServer(app)
    // const httpsServer = https.createServer(credentials, app)

    // httpServer.listen(PORT, () => console.log(`App has been started on port ${PORT}`))
    // httpsServer.listen(SLL_PORT, () => console.log(`App has been started with ssl on port ${SLL_PORT}`))
}

function run() {
    try { start() }
    catch(error) { process.exit(1) }
}

run()
