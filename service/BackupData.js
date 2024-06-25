const express = require('express');
const router = express.Router();
const path = require('path');
const token = require('../middleware/token');
const isAdmin = require('../middleware/isAdmin');
const fs = require('fs');

const { authenticate } = require('@google-cloud/local-auth');
const { google } = require('googleapis');
const CREDENTIALS_PATH = 'credentials.json';
const TOKEN_PATH = 'token.json';

// Configure OAuth2 client
const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
const { client_secret, client_id, redirect_uris } = credentials.web;
const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

// Check if we have previously stored a token.
if (fs.existsSync(TOKEN_PATH)) {
    const token = fs.readFileSync(TOKEN_PATH);
    oAuth2Client.setCredentials(JSON.parse(token));
} else {
    getAccessToken(oAuth2Client);
}
function getAccessToken(oAuth2Client) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/drive.file'],
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    // After the user authorizes the app, they will be redirected to the redirect URI
    // with a code in the query parameters. Extract that code and exchange it for tokens.
    router.get('/oauth2callback', async (req, res) => {
        const code = req.query.code;
        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens);
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
        //res.send('Authentication successful! You can close this tab.');
    });
}
async function createFolder(drive, folderName,parentFolderId=null) {
    const fileMetadata = {
        'name': folderName,
        'mimeType': 'application/vnd.google-apps.folder',
        parents: [parentFolderId]
    };
    const folder = await drive.files.create({
        resource: fileMetadata,
        fields: 'id'
    });
    return folder.data.id;
}

async function uploadFile(drive, filePath, folderId) {
    const fileMetadata = {
        'name': path.basename(filePath),
        parents: [folderId]
    };
    const media = {
        mimeType: 'application/octet-stream',
        // mimeType: mime.lookup(filePath),
        body: fs.createReadStream(filePath)
    };
    const file = await drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id'
    });
    return file.data.id;
}

async function uploadFolder(drive, localFolderPath, parentFolderId) {
    const items = fs.readdirSync(localFolderPath);
    for (let item of items) {
        const itemPath = path.join(localFolderPath, item);
        const itemStats = fs.statSync(itemPath);
        if (itemStats.isDirectory()) {
            const folderId = await createFolder(drive, item, parentFolderId);
            await uploadFolder(drive, itemPath, folderId);
        } else if (itemStats.isFile()) {
            await uploadFile(drive, itemPath, parentFolderId);
        }
    }
}

router.get("/api/admin/backup", token.jwtValidate, isAdmin, async (req, res) => {
    const folderPath = path.resolve(__dirname,'../public');
    //console.log(folderPath)
    const folderName = "DATA "+new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format

    try {
        const drive = google.drive({ version: 'v3', auth: oAuth2Client });
        const rootFolderId = await createFolder(drive, folderName);
        await uploadFolder(drive, folderPath, rootFolderId);
        console.log("backup success")
        res.status(200).json({status:"ok"});
    } catch (error) {
        console.log(error)
        res.status(500).json({status:"no"});
    }
})

module.exports = router