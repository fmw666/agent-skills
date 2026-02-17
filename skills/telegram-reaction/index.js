const https = require("https");
const fs = require("fs");
const path = require("path");

const HOME = process.env.HOME || "/home/node";
const CONFIG_PATH = path.join(HOME, ".openclaw", "openclaw.json");

function getTelegramToken() {
  try {
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
    if (config.channels && config.channels.telegram && config.channels.telegram.botToken) {
      return config.channels.telegram.botToken;
    }
  } catch (e) {
    console.error("Failed to read config:", e);
  }
  return process.env.TELEGRAM_BOT_TOKEN;
}

/**
 * Adds a reaction to a Telegram message using the Telegram Bot API directly.
 * Handles single or multiple emojis.
 * 
 * If multiple emojis are provided, it sends them sequentially to create an "animation" effect,
 * as Bots are currently limited to 1 reaction per message (overwriting the previous one).
 */
async function addReactions(chatId, messageId, emojis) {
  const token = getTelegramToken();
  if (!token) {
    console.error("Telegram Bot Token not found in config or env");
    process.exit(1);
  }

  // Normalize emojis to array
  let reactionList = [];
  if (Array.isArray(emojis)) {
    reactionList = emojis;
  } else if (typeof emojis === 'string') {
    try {
      const parsed = JSON.parse(emojis);
      if (Array.isArray(parsed)) {
        reactionList = parsed;
      } else {
        reactionList = [emojis];
      }
    } catch (e) {
      if (emojis.includes(',')) {
        reactionList = emojis.split(',').map(e => e.trim());
      } else {
        reactionList = [emojis];
      }
    }
  }

  // Animation delay (ms) between reactions
  const DELAY_MS = 800; 

  for (const emoji of reactionList) {
    await setReaction(token, chatId, messageId, emoji);
    if (reactionList.length > 1) {
        await new Promise(r => setTimeout(r, DELAY_MS));
    }
  }
}

async function setReaction(token, chatId, messageId, emoji) {
  // Format: reaction=[{type: "emoji", emoji: "👍"}]
  // We send only ONE emoji at a time because Bots generally error with >1
  const reactionPayload = [{ type: "emoji", emoji: emoji }];

  const postData = JSON.stringify({
    chat_id: chatId,
    message_id: messageId,
    reaction: reactionPayload
  });

  const options = {
    hostname: 'api.telegram.org',
    path: `/bot${token}/setMessageReaction`,
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
            console.log(JSON.stringify({ ok: true, added: emoji }));
            resolve(json);
          } else {
            // Use console.error so it doesn't mix with stdout JSON
            console.error(JSON.stringify({ ok: false, error: json.description, code: json.error_code }));
            // Don't reject, just log error and continue animation if possible
            resolve(null); 
          }
        } catch (e) {
            console.error(e);
            resolve(null);
        }
      });
    });
    req.on('error', (e) => {
        console.error(e);
        resolve(null);
    });
    req.write(postData);
    req.end();
  });
}


// Main execution block
// Supports two formats:
// 1. JSON argument: node index.js '{"chatId": "-123", "messageId": "123", "emoji": ["👍", "🔥"]}'
// 2. Positional args: node index.js <chatId> <messageId> <emoji1> <emoji2> ...

const arg1 = process.argv[2];

if (!arg1) {
  console.log("Usage: node index.js 'JSON' OR node index.js <chat_id> <message_id> <emoji> [emoji2 ...]");
  process.exit(1);
}

let chatId, messageId, emojis;

if (arg1.trim().startsWith('{')) {
  try {
    const json = JSON.parse(arg1);
    chatId = json.chatId;
    messageId = json.messageId;
    // Support single string or array of emojis
    emojis = json.emoji || json.emojiType; 
  } catch (e) {
    console.error("Invalid JSON argument");
    process.exit(1);
  }
} else {
  chatId = arg1;
  messageId = process.argv[3];
  // Collect all remaining arguments as emojis
  const remainingArgs = process.argv.slice(4);
  if (remainingArgs.length === 1) {
    emojis = remainingArgs[0];
  } else if (remainingArgs.length > 1) {
    emojis = remainingArgs;
  }
}

if (!chatId || !messageId || !emojis) {
  console.error("Missing chatId, messageId or emoji(s)");
  process.exit(1);
}

addReactions(chatId, messageId, emojis).catch(() => process.exit(1));
