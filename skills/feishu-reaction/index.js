const https = require('https');
const fs = require('fs');
const path = require('path');

// Load configuration
const configPath = path.join(__dirname, 'config.json');
const tokenCachePath = path.join(__dirname, 'token.json');

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

// Full supported Emoji list (Based on Feishu docs & common usage)
const SUPPORTED_EMOJIS = {
    // Gestures / Symbols
    "THUMBSUP": "👍",
    "THUMBSDOWN": "👎",
    "HEART": "❤️",
    "OK": "👌",
    "APPLAUSE": "👏",
    "MUSCLE": "💪",
    "FISTBUMP": "👊",
    "HIGHFIVE": "🙌",
    "FINGERHEART": "🫰",
    "WAVE": "👋",
    "SALUTE": "🫡",
    "SHAKE": "🤝",
    "PRAY": "🙏",
    "FIRE": "🔥",
    "AWESOMEN": "666",
    "PLUSONE": "+1",
    "PARTY": "🎉",
    "GIFT": "🎁",
    "ROSE": "🌹",
    "BETRAYED": "🥀",
    "KISS": "😚",
    "LOVE": "🥰",

    // Faces
    "SMILE": "😀",
    "LAUGH": "😄",
    "BLUSH": "😊",
    "SOB": "😭",
    "CRY": "😢",
    "ANGRY": "😠",
    "DULL": "😑",
    "FACEPALM": "🤦",
    "SMIRK": "😏",
    "WHAT": "😮",
    "WOW": "🤩",
    "SMART": "🤓",
    "LOOKDOWN": "🙄",
    "WINK": "😉",
    "CRAZY": "🤪",
    "SHY": "😳",
    "TIRED": "😫",
    "SLEEP": "😴",
    "SICK": "😷",
    "EATING": "😋"
};

// Aliases for common mistakes or alternative names
const EMOJI_ALIASES = {
    "LIKE": "THUMBSUP",
    "GOOD": "THUMBSUP",
    "LOVE": "HEART",
    "YES": "OK",
    "CLAP": "APPLAUSE",
    "STRONG": "MUSCLE",
    "PUNCH": "FISTBUMP",
    "HI": "WAVE",
    "BYE": "WAVE",
    "RESPECT": "SALUTE",
    "THANKS": "PRAY",
    "HOT": "FIRE",
    "LIT": "FIRE",
    "666": "AWESOMEN",
    "COOL": "AWESOMEN",
    "EAT": "EATING",
    "EATFOOD": "EATING",
    "YUM": "EATING",
    "SAD": "CRY",
    "CRYING": "SOB",
    "HAPPY": "SMILE"
};

/**
 * Reads token from cache. Returns null if missing or expired.
 */
function getCachedToken() {
    try {
        if (fs.existsSync(tokenCachePath)) {
            const cache = JSON.parse(fs.readFileSync(tokenCachePath, 'utf8'));
            // Expire 5 minutes early to be safe
            if (Date.now() < (cache.expire_at - 300000)) {
                return cache.token;
            }
        }
    } catch (e) {
        // Ignore cache errors
    }
    return null;
}

/**
 * Saves token to cache.
 */
function saveToken(token, expireSeconds) {
    try {
        const data = {
            token: token,
            expire_at: Date.now() + (expireSeconds * 1000)
        };
        fs.writeFileSync(tokenCachePath, JSON.stringify(data));
    } catch (e) {
        console.warn("Warning: Failed to save token cache.");
    }
}

/**
 * Gets a tenant access token from Feishu (with Caching).
 * @returns {Promise<string>} The access token.
 */
async function getTenantAccessToken() {
    // 1. Check Cache
    const cached = getCachedToken();
    if (cached) {
        return cached;
    }

    // 2. Fetch New
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
                            saveToken(parsed.tenant_access_token, parsed.expire);
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

    // LIST command: Output supported emojis
    if (params.list) {
        console.log(JSON.stringify({ 
            status: "success", 
            supportedEmojis: SUPPORTED_EMOJIS,
            aliases: EMOJI_ALIASES,
            count: Object.keys(SUPPORTED_EMOJIS).length
        }));
        process.exit(0);
    }

    if (!params.messageId || !params.emojiType) {
        console.error("Error: messageId and emojiType are required.");
        process.exit(1);
    }
    
    // Validate emoji type (case-insensitive + alias fix)
    let finalEmojiType = params.emojiType;
    let upper = finalEmojiType.toUpperCase();

    // 1. Check direct match (exact or upper)
    if (SUPPORTED_EMOJIS[finalEmojiType]) {
        // perfect match, do nothing
    } else if (SUPPORTED_EMOJIS[upper]) {
        console.warn(`Warning: Auto-corrected emoji type '${finalEmojiType}' to '${upper}'`);
        finalEmojiType = upper;
    } 
    // 2. Check Alias
    else if (EMOJI_ALIASES[upper]) {
        console.warn(`Warning: Mapped alias '${finalEmojiType}' to '${EMOJI_ALIASES[upper]}'`);
        finalEmojiType = EMOJI_ALIASES[upper];
    }
    else {
        console.warn(`Warning: Unknown emoji type '${finalEmojiType}'. Attempting to send anyway (Feishu might reject it).`);
    }

    (async () => {
        try {
            const token = await getTenantAccessToken();
            const result = await addReaction(token, params.messageId, finalEmojiType);
            console.log(JSON.stringify({ status: "success", data: result, emoji: SUPPORTED_EMOJIS[finalEmojiType] }));
        } catch (error) {
            console.error(JSON.stringify({ status: "error", message: error.message }));
            process.exit(1);
        }
    })();
}

module.exports = { getTenantAccessToken, addReaction, SUPPORTED_EMOJIS, EMOJI_ALIASES };
