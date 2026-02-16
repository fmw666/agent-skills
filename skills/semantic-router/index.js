/**
 * Semantic Router - The Core Understanding Module
 * 
 * Takes raw text input and returns structured intent analysis via LLM.
 * Designed to be the "Brain" for Sentinel and other reactive skills.
 */

const { execSync } = require('child_process');

// Define the Schema for Intent Analysis
const SCHEMA = {
    intent: "question | command | chit_chat | spam | unknown",
    target: "me | specific_user | everyone | nobody",
    urgency: "high | medium | low",
    sentiment: "positive | neutral | negative",
    entities: ["<extracted_entity_1>", "<extracted_entity_2>"],
    safety: "safe | risky"
};

/**
 * Main Router Function (v1.1 - Strict Mode)
 */
function route(text, myName = "OpenClaw") {
    const lower = text.toLowerCase();
    const myNameLower = myName.toLowerCase();
    
    // Heuristic 1: Targeting (STRICT MODE)
    // Default: Nobody (Silence is golden)
    let target = "nobody";
    
    // Identity Keywords (Aliases)
    const aliases = [myNameLower, 'bot', 'agent', '小范', '炎柱', 'openclaw'];
    
    // Check for explicit mention or aliases
    const hasAlias = aliases.some(a => lower.includes(a));
    const hasAtMe = lower.includes(`@${myNameLower}`);
    
    if (hasAtMe || hasAlias) {
        target = "me";
    } else if (text.includes("@")) {
        // If @ someone else, definitely NOT me
        target = "specific_user"; 
        // SAFETY OVERRIDE: If targeting someone else, FORCE intent to IGNORE/UNKNOWN to prevent LLM from hallucinating relevance.
        // Even if keywords match, we must not interrupt.
        return {
            intent: "ignore", // Special intent for Sentinel to catch
            target: "specific_user",
            urgency: "low",
            sentiment: "neutral",
            entities: [],
            safety: "safe",
            _note: "hard_block_other_mention"
        };
    } else {
        // No mentions at all? 
        // Only consider "me" if context implies continuation (handled by Sentinel memory, not here)
        // Router sees single message: so it's "everyone" or "nobody".
        // Let's call it "everyone" (broadcast) but Sentinel should filter it.
        target = "everyone";
    }

    // Heuristic 2: Intent
    let intent = "chit_chat";
    if (lower.includes("?") || lower.includes("怎么") || lower.includes("what") || lower.includes("如何") || lower.includes("求助")) intent = "question";
    if (lower.includes("run") || lower.includes("exec") || lower.includes("执行") || lower.includes("启动")) intent = "command";
    
    // Heuristic 3: Safety
    let safety = "safe";
    const dangerWords = ["delete", "rm -rf", "format", "删除", "清空", "销毁", "shutdown", "reboot"];
    if (dangerWords.some(w => lower.includes(w))) safety = "risky";

    return {
        intent,
        target,
        urgency: "medium",
        sentiment: "neutral",
        entities: [],
        safety,
        _note: "v1.1_strict_heuristic"
    };
}

// CLI Interface
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.error("Usage: node index.js '<text>' [my_name]");
        process.exit(1);
    }
    const result = route(args[0], args[1]);
    console.log(JSON.stringify(result, null, 2));
}

module.exports = { route };
