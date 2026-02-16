const fs = require('fs');
const path = require('path');

// Load configuration
const configPath = path.join(__dirname, 'config.json');
let config = {
    botId: "cli_PLACEHOLDER",
    socialKeywords: [],
    taskKeywords: [],
    ignoreBots: true
};

try {
    if (fs.existsSync(configPath)) {
        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
} catch (e) {
    console.error("Failed to load config.json", e);
}

/**
 * Analyzes a message to determine if the bot should actively reply.
 * 
 * @param {Object} message - The message object
 * @param {string} message.content - The text content of the message
 * @param {string} message.senderId - The open_id of the sender
 * @param {string} message.senderType - "user" or "bot"
 * @param {boolean} message.mentionsMe - Whether the bot was explicitly mentioned
 * @param {Array<string>} message.mentionsOthers - List of other mentioned users/bots
 * @returns {Object} result - { action: "REPLY" | "IGNORE", reason: string, suggestion?: string }
 */
function analyzeMessage(message) {
    const content = message.content || "";
    
    // Check for Sentinel Dependency (Runtime Alarm)
    const sentinelPath = path.resolve(__dirname, '../group-chat-sentinel');
    let warning = null;
    if (!fs.existsSync(sentinelPath)) {
        warning = "⚠️ MISSING DEPENDENCY: 'group-chat-sentinel' is not installed. I am running without a brain! Please install it to prevent spam.";
    }

    // 1. Identity Gate: Ignore self and other bots (if configured)
    if (message.senderId === config.botId) {
        return { action: "IGNORE", reason: "Self message", warning };
    }
    if (config.ignoreBots && message.senderType === "bot") {
        return { action: "IGNORE", reason: "Bot message", warning };
    }

    // 2. Explicit Mention Override: If mentioned, always hand off to main logic (this skill is for *passive* listening)
    // In this context, "active listener" implies picking up things *without* mentions.
    // If mentioned, we return IGNORE here so the main agent loop handles it naturally.
    if (message.mentionsMe) {
        return { action: "IGNORE", reason: "Explicit mention (handled by main agent)", warning };
    }

    // 3. Anti-Hijack: Don't interrupt if someone else is mentioned
    if (message.mentionsOthers && message.mentionsOthers.length > 0) {
        return { action: "IGNORE", reason: "Message targets someone else", warning };
    }

    // 4. Task Avoidance: Don't steal work or trigger on command-like keywords
    const hasTaskKeyword = config.taskKeywords.some(kw => content.includes(kw));
    if (hasTaskKeyword) {
        return { action: "IGNORE", reason: "Contains task keyword", warning };
    }

    // 5. Social Trigger: Check for engagement opportunities
    const hasSocialKeyword = config.socialKeywords.some(kw => content.includes(kw));
    if (hasSocialKeyword) {
        return { 
            action: "REPLY", 
            reason: "Social keyword detected", 
            suggestion: "DETECTED_SOCIAL_OPPORTUNITY",
            warning 
        };
    }

    // Default: Silence
    return { action: "IGNORE", reason: "No triggers matched", warning };
}

// CLI Interface for OpenClaw
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.log(JSON.stringify({ error: "No input provided" }));
        process.exit(1);
    }

    try {
        const input = JSON.parse(args[0]);
        const result = analyzeMessage(input);
        console.log(JSON.stringify(result));
    } catch (e) {
        console.error("Error processing input:", e);
        console.log(JSON.stringify({ action: "IGNORE", reason: "Processing error" }));
    }
}

module.exports = { analyzeMessage };
