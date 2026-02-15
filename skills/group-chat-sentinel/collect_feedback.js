const https = require('https');
const fs = require('fs');
const path = require('path');

// --- Configuration ---
// In a real deployment, these come from env vars or a secure config file
const APP_ID = process.env.FEISHU_APP_ID || "cli_a9006ccfe9781bef"; 
const APP_SECRET = process.env.FEISHU_APP_SECRET || "ninCI2gord9ngQkIBmxFucX4KyrtMqde";
// TODO: Load from config file if available

const LOG_DIR = path.join(__dirname, 'logs');
const SUCCESS_FILE = path.join(LOG_DIR, 'successes.md');
const FAILURE_FILE = path.join(LOG_DIR, 'failures.md');
const HISTORY_FILE = path.join(LOG_DIR, 'scanned_messages.json'); // To avoid rescanning old stuff forever

// Feedback Signals
const POSITIVE_SIGNALS = ["THUMBSUP", "OK", "APPLAUSE", "MUSCLE", "FISTBUMP", "HIGHFIVE", "FIRE", "AWESOMEN"];
const NEGATIVE_SIGNALS = ["SHHH", "NO", "THUMBSDOWN", "ANGRY"]; // SHHH = 🤫

// --- Feishu API Helpers (Reused from feishu-reaction, essentially) ---

function getTenantAccessToken() {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({ "app_id": APP_ID, "app_secret": APP_SECRET });
        const req = https.request({
            hostname: 'open.feishu.cn', path: '/open-apis/auth/v3/tenant_access_token/internal', method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8' }
        }, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                const parsed = JSON.parse(data);
                if (parsed.code === 0) resolve(parsed.tenant_access_token);
                else reject(new Error(`Token Error: ${parsed.msg}`));
            });
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

function getReactions(token, messageId) {
    return new Promise((resolve, reject) => {
        const req = https.request({
            hostname: 'open.feishu.cn', 
            path: `/open-apis/im/v1/messages/${messageId}/reactions`, 
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        }, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                const parsed = JSON.parse(data);
                if (parsed.code === 0) resolve(parsed.data.items || []);
                else {
                    // console.warn(`Reaction Fetch Warning for ${messageId}: ${parsed.msg}`);
                    resolve([]); // Fail gracefully
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

// --- Logic ---

async function run() {
    console.log('🛡️ Sentinel Scout: Starting patrol...');
    
    // 1. Load History (Messages we track)
    // In a full implementation, the Sentinel main logic would append message IDs here when it replies.
    // For this prototype, we assume `recent_messages.json` exists or we rely on explicit input.
    // However, to be autonomous, let's look for a `recent_messages.json` file in the logs dir.
    
    const trackingFile = path.join(LOG_DIR, 'recent_messages.json');
    let trackedMessages = [];
    
    if (fs.existsSync(trackingFile)) {
        trackedMessages = JSON.parse(fs.readFileSync(trackingFile, 'utf8'));
    } else {
        console.log('⚠️ No tracking file found. Waiting for Sentinel to log outgoing messages to logs/recent_messages.json');
        return;
    }

    if (trackedMessages.length === 0) {
        console.log('✅ No messages to check.');
        return;
    }

    try {
        const token = await getTenantAccessToken();
        let newSuccesses = 0;
        let newFailures = 0;

        for (const msg of trackedMessages) {
            // msg structure: { id: "om_...", timestamp: 123..., context: "..." }
            const reactions = await getReactions(token, msg.id);
            
            // Check for signals
            const hasPositive = reactions.some(r => POSITIVE_SIGNALS.includes(r.reaction_type.emoji_type));
            const hasNegative = reactions.some(r => NEGATIVE_SIGNALS.includes(r.reaction_type.emoji_type));

            if (hasPositive) {
                logFeedback(SUCCESS_FILE, msg, reactions, "POSITIVE");
                newSuccesses++;
                removeFromTracking(trackedMessages, msg.id); // Done learning
            } else if (hasNegative) {
                logFeedback(FAILURE_FILE, msg, reactions, "NEGATIVE");
                newFailures++;
                removeFromTracking(trackedMessages, msg.id); // Done learning
            } else {
                // Check age. If older than 24h, stop tracking to save API calls.
                const ageHours = (Date.now() - msg.timestamp) / (1000 * 60 * 60);
                if (ageHours > 24) {
                    removeFromTracking(trackedMessages, msg.id);
                }
            }
            
            // Rate limit politeness
            await new Promise(r => setTimeout(r, 200)); 
        }

        // Save updated tracking list
        fs.writeFileSync(trackingFile, JSON.stringify(trackedMessages.filter(m => !m._deleted), null, 2));
        
        console.log(`🛡️ Patrol complete. Logged ${newSuccesses} successes and ${newFailures} failures.`);

    } catch (e) {
        console.error("❌ Scout Error:", e);
    }
}

function logFeedback(filePath, msg, reactions, type) {
    if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, `# Sentinel ${type === 'POSITIVE' ? 'Successes (👍)' : 'Failures (🤫)'}\n\n`);
    
    const reactionTypes = reactions.map(r => r.reaction_type.emoji_type).join(', ');
    const entry = `
### Message: ${msg.id}
- **Date:** ${new Date().toISOString()}
- **Reactions:** ${reactionTypes}
- **Context:** ${msg.context || "N/A"}
- **Content:** "${msg.content || "N/A"}"

---
`;
    fs.appendFileSync(filePath, entry);
}

function removeFromTracking(list, id) {
    const item = list.find(m => m.id === id);
    if (item) item._deleted = true;
}

// Run
if (require.main === module) {
    // If passed args, we can use them to ADD to tracking (Hook mode)
    // node collect_feedback.js add om_123 "Context string" "Message content"
    const args = process.argv.slice(2);
    if (args[0] === 'add') {
        const id = args[1];
        const context = args[2];
        const content = args[3];
        const trackingFile = path.join(LOG_DIR, 'recent_messages.json');
        let list = [];
        if (fs.existsSync(trackingFile)) list = JSON.parse(fs.readFileSync(trackingFile, 'utf8'));
        
        list.push({
            id,
            context,
            content,
            timestamp: Date.now()
        });
        
        if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR);
        fs.writeFileSync(trackingFile, JSON.stringify(list, null, 2));
        console.log(`✅ Tracked message ${id}`);
    } else {
        run();
    }
}

module.exports = { run };
