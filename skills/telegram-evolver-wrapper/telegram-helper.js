const https = require('https');
const fs = require('fs');
const path = require('path');

const HOME = process.env.HOME || '/home/node';
const CONFIG_PATH = path.join(HOME, '.openclaw', 'openclaw.json');

function getTelegramToken() {
    try {
        if (process.env.TELEGRAM_BOT_TOKEN) return process.env.TELEGRAM_BOT_TOKEN;
        if (fs.existsSync(CONFIG_PATH)) {
            const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
            if (config.channels?.telegram?.botToken) {
                return config.channels.telegram.botToken;
            }
        }
    } catch (e) {
        console.warn('[TelegramHelper] Failed to read config:', e.message);
    }
    return null;
}

function getChatId() {
    return process.env.TELEGRAM_CHAT_ID;
}

/**
 * Sends a message to a Telegram chat.
 * @param {object} params - { chatId, text, parse_mode, reply_to_message_id }
 */
async function sendMessage(params) {
    const token = getTelegramToken();
    if (!token) {
        console.error('[TelegramHelper] Missing TELEGRAM_BOT_TOKEN');
        return;
    }

    const chatId = params.chatId || getChatId();
    if (!chatId) {
        console.error('[TelegramHelper] Missing chatId');
        return;
    }

    const postData = JSON.stringify({
        chat_id: chatId,
        text: params.text,
        parse_mode: params.parse_mode || 'Markdown',
        reply_to_message_id: params.reply_to_message_id
    });

    const options = {
        hostname: 'api.telegram.org',
        path: `/bot${token}/sendMessage`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.ok) {
                        resolve(json.result);
                    } else {
                        console.error('[TelegramHelper] Error:', json.description);
                        resolve(null);
                    }
                } catch (e) {
                    console.error('[TelegramHelper] Parse error:', e);
                    resolve(null);
                }
            });
        });
        req.on('error', (e) => {
            console.error('[TelegramHelper] Request error:', e);
            resolve(null);
        });
        req.write(postData);
        req.end();
    });
}

/**
 * Sends a report (formatted text) to Telegram.
 * Replaces Feishu card logic.
 */
async function sendReport(reportData) {
    const { title, status, details, color } = reportData;
    
    // Convert status/color to emoji
    let statusEmoji = 'ℹ️';
    if (color === 'green' || status.includes('Success')) statusEmoji = '✅';
    if (color === 'red' || status.includes('Fail')) statusEmoji = '❌';
    if (color === 'yellow' || status.includes('Warn')) statusEmoji = '⚠️';

    const message = `*${title}*\n${statusEmoji} ${status}\n\n${details || ''}`;
    
    return sendMessage({
        text: message,
        parse_mode: 'Markdown'
    });
}

module.exports = {
    sendMessage,
    sendReport
};
