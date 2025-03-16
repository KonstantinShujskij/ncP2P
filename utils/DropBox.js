const fetch = require('node-fetch')
const path = require('path')
const fs = require('fs')

const config = require('config')


async function getAccessToken() {   
    try {
        const response = await fetch('https://api.dropboxapi.com/oauth2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: config.get('dropBoxRefreshToken'),
                client_id: config.get('dropBoxApiKey'),
                client_secret: config.get('dropBoxApiSecret')
            })
        })

        const data = await response.json()
        if(!response.ok) { return null }

        return data.access_token
    } 
    catch(error) {
        console.log('::: Cant get access toket to dropBox')
        console.log(error);
        
        return null
    }
}

async function uploadFile(fileName) {
    const accessToken = await getAccessToken()
    if(!accessToken) { return null }

    const filePath = path.join(__dirname,  `../static/kvits/${fileName}`)    
    if(!fs.existsSync(filePath)) { return null }

    const fileContent = fs.readFileSync(filePath)
    
    const response = await fetch('https://content.dropboxapi.com/2/files/upload', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Dropbox-API-Arg': JSON.stringify({ path: `/${fileName}`, mode: 'add', autorename: true }),
            'Content-Type': 'application/octet-stream',
        },
        body: fileContent,
    })
    
    const data = await response.json()    
    return data?.path_lower
}

async function getSharedLink(dropboxPath) {
    const accessToken = await getAccessToken()
    if(!accessToken) { return null }

    const response = await fetch('https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            path: dropboxPath,
            settings: {
                requested_visibility: "public",
                audience: "public",
                access: "viewer"
            }
        })
    })
    
    const data = await response.json()
    return data?.url
}

async function saveKvit(fileName) {
    try {
        const filePath = await uploadFile(fileName)
        console.log('DropBox Path:', filePath)
        
        const link = await getSharedLink(filePath)
        console.log('Link to Proof in DropBox', link)

        return link
    }
    catch(err) {
        console.log(err)
        return null
    }
}


module.exports = {
    saveKvit
}
