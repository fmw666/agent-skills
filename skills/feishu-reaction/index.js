const https = require('https');
const fs = require('fs');
const path = require('path');

// Load configuration
const configPath = path.join(__dirname, 'config.json');
let config = {};

// Try loading from config.json
try {
    if (fs.existsSync(configPath)) {
        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
} catch (e) {
    console.warn("Warning: Failed to load config.json, falling back to environment variables.");
}

// Fallback to environment variables
config.appId = config.appId || process.env.FEISHU_APP_ID;
config.appSecret = config.appSecret || process.env.FEISHU_APP_SECRET;

// Ensure required config exists
if (!config.appId || !config.appSecret) {
    console.error("Error: appId and appSecret must be set in config.json or environment variables (FEISHU_APP_ID, FEISHU_APP_SECRET).");
    process.exit(1);
}

/**
 * Gets a tenant access token from Feishu.
 * @returns {Promise<string>} The access token.
 */
function getTenantAccessToken() {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            "app_id": config.appId,
            "app_secret": config.appSecret
        });

        const options = {
            hostname: 'open.feishu.cn',
            path: '/open-apis/auth/v3/tenant_access_token/internal',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        const parsed = JSON.parse(data);
                        if (parsed.code === 0) {
                            resolve(parsed.tenant_access_token);
                        } else {
                            reject(new Error(`Feishu API Error: ${parsed.msg} (code: ${parsed.code})`));
                        }
                    } catch (e) {
                        reject(new Error("Failed to parse token response"));
                    }
                } else {
                    reject(new Error(`HTTP Error: ${res.statusCode} ${res.statusMessage}`));
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.write(postData);
        req.end();
    });
}

/**
 * Adds a reaction to a message.
 * @param {string} token - The access token.
 * @param {string} messageId - The ID of the message to react to.
 * @param {string} emojiType - The type of emoji to react with.
 * @returns {Promise<object>} The result of the operation.
 */
function addReaction(token, messageId, emojiType) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            "reaction_type": {
                "emoji_type": emojiType
            }
        });

        const options = {
            hostname: 'open.feishu.cn',
            path: `/open-apis/im/v1/messages/${messageId}/reactions`,
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json; charset=utf-8',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                // Feishu returns 200 OK for success, but check body code too
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        const parsed = JSON.parse(data);
                        if (parsed.code === 0) {
                            resolve(parsed);
                        } else {
                            reject(new Error(`Feishu API Error: ${parsed.msg} (code: ${parsed.code}) - ${JSON.stringify(parsed.error)}`));
                        }
                    } catch (e) {
                        reject(new Error("Failed to parse reaction response"));
                    }
                } else {
                    reject(new Error(`HTTP Error: ${res.statusCode} ${res.statusMessage}`));
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.write(postData);
        req.end();
    });
}

// Main execution block
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.error("Usage: node index.js '<json_params>'");
        console.error("Example: node index.js '{\"messageId\": \"om_...\", \"emojiType\": \"THUMBSUP\"}'");
        process.exit(1);
    }

    let params;
    try {
        params = JSON.parse(args[0]);
    } catch (e) {
        console.error("Error: Invalid JSON input.");
        process.exit(1);
    }

    if (!params.messageId || !params.emojiType) {
        console.error("Error: messageId and emojiType are required.");
        process.exit(1);
    }

    (async () => {
        try {
            const token = await getTenantAccessToken();
            const result = await addReaction(token, params.messageId, params.emojiType);
            console.log(JSON.stringify({ status: "success", data: result }));
        } catch (error) {
            console.error(JSON.stringify({ status: "error", message: error.message }));
            process.exit(1);
        }
    })();
}

module.exports = { getTenantAccessToken, addReaction };
