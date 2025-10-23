const fs = require('fs');
const mime = require('mime-types');

const {
    ZOHO_CLIENT_ID,
    ZOHO_CLIENT_SECRET,
    ZOHO_REFRESH_TOKEN,
    ZOHO_ACCOUNTS_BASE,
    ZOHO_WORKDRIVE_BASE,
    WORKDRIVE_ASSISTANT_PARENT_ID
} = require('../../../config');
const { path } = require('pdfkit');

async function getAccessToken() {
    const url = `${ZOHO_ACCOUNTS_BASE}/oauth/v2/token`;
    const body = new URLSearchParams({
        refresh_token: ZOHO_REFRESH_TOKEN,
        client_id: ZOHO_CLIENT_ID,
        client_secret: ZOHO_CLIENT_SECRET,
        grant_type: "refresh_token",
    });

    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
    });

    const data = await response.json();
    if (!data.access_token) throw new Error("Failed to get token: " + JSON.stringify(data));
    
    return data.access_token;
}

async function uploadToWorkDrive(filePath, fileName, parentId = WORKDRIVE_ASSISTANT_PARENT_ID) {
    
    if (!fs.existsSync(filePath)) throw new Error("File not found: " + filePath);
    if (!parentId) throw new Error("parent_id is missing/undefined");

    const token = await getAccessToken();

    const buf = await fs.promises.readFile(filePath);
    const type = mime.lookup(fileName) || "application/octet-stream";

    const form = new FormData();
    form.append('content', new Blob([buf], { type }), fileName);
    form.append('parent_id', parentId);
    form.append('override-name-exist', 'true');

    const response = await fetch(`${ZOHO_WORKDRIVE_BASE}/api/v1/upload`, {
        method: 'POST',
        headers: {
            Authorization: `Zoho-oauthtoken ${token}`,
        },
        body: form
    });

    const data = await response.json();
    if (!response.ok) throw new Error(JSON.stringify(data));
    const row = Array.isArray(data?.data) ? data.data[0] : data.data ?? data;

    return { 
        fileId: row.id, 
        name: row.name, 
        type: row.type, 
        raw: data 
    };
}

module.exports = {
    uploadToWorkDrive
};