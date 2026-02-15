const https = require('https');
const fs = require('fs');
const path = require('path');

// --- Configuration ---
const configPath = path.join(__dirname, 'config.json');
const tokenCachePath = path.join(__dirname, '../feishu-reaction/token.json'); // Reuse reaction token cache if possible
const localTokenCachePath = path.join(__dirname, 'token.json'); // Local fallback

let config = {};

// Try loading config
try {
    if (fs.existsSync(configPath)) {
        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
} catch (e) {
    console.warn("Warning: Failed to load config.json, falling back to env.");
}

config.appId = config.appId || process.env.FEISHU_APP_ID;
config.appSecret = config.appSecret || process.env.FEISHU_APP_SECRET;

if (!config.appId || !config.appSecret) {
    console.error("Error: appId and appSecret required.");
    process.exit(1);
}

// --- Token Logic (Simplified & Shared) ---

function getCachedToken() {
    // Try shared cache first
    try {
        if (fs.existsSync(tokenCachePath)) {
            const cache = JSON.parse(fs.readFileSync(tokenCachePath, 'utf8'));
            if (Date.now() < (cache.expire_at - 300000)) return cache.token;
        }
    } catch (e) {}
    
    // Try local cache
    try {
        if (fs.existsSync(localTokenCachePath)) {
            const cache = JSON.parse(fs.readFileSync(localTokenCachePath, 'utf8'));
            if (Date.now() < (cache.expire_at - 300000)) return cache.token;
        }
    } catch (e) {}
    return null;
}

function saveToken(token, expireSeconds) {
    try {
        const data = { token, expire_at: Date.now() + (expireSeconds * 1000) };
        fs.writeFileSync(localTokenCachePath, JSON.stringify(data));
    } catch (e) {}
}

async function getTenantAccessToken() {
    const cached = getCachedToken();
    if (cached) return cached;

    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({ "app_id": config.appId, "app_secret": config.appSecret });
        const req = https.request({
            hostname: 'open.feishu.cn', path: '/open-apis/auth/v3/tenant_access_token/internal', method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8' }
        }, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                const parsed = JSON.parse(data);
                if (parsed.code === 0) {
                    saveToken(parsed.tenant_access_token, parsed.expire);
                    resolve(parsed.tenant_access_token);
                } else reject(new Error(`Token Error: ${parsed.msg}`));
            });
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

// --- Recall Logic ---

async function recallMessage(token, messageId) {
    return new Promise((resolve, reject) => {
        const req = https.request({
            hostname: 'open.feishu.cn', 
            path: `/open-apis/im/v1/messages/${messageId}`, 
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        }, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                const parsed = JSON.parse(data);
                if (parsed.code === 0) resolve(parsed);
                else reject(new Error(`Recall Error: ${parsed.msg} (code: ${parsed.code})`));
            });
        });
        req.on('error', reject);
        req.end();
    });
}

// --- Main ---

if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.error("Usage: node index.js '{\"messageId\": \"om_...\"}'");
        process.exit(1);
    }

    let params;
    try {
        params = JSON.parse(args[0]);
    } catch (e) {
        console.error("Error: Invalid JSON.");
        process.exit(1);
    }

    if (!params.messageId) {
        console.error("Error: messageId required.");
        process.exit(1);
    }

    (async () => {
        try {
            const token = await getTenantAccessToken();
            const result = await recallMessage(token, params.messageId);
            console.log(JSON.stringify({ status: "success", data: result }));
        } catch (error) {
            console.error(JSON.stringify({ status: "error", message: error.message }));
            process.exit(1);
        }
    })();
}
