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
 * Main Router Function
 * Uses the Agent's own LLM capabilities (via reflection or loopback) to analyze text.
 * Since this runs as a tool, we might need to rely on the calling Agent to do the thinking,
 * OR we use a lightweight specialized model call if available.
 * 
 * For v1, we will simulate a "Mock Router" that uses simple regex heuristics 
 * to prove the architecture, as calling LLM from within a tool script is complex 
 * without an API key. 
 * 
 * TODO: Upgrade to real LLM call in v2.
 */
function route(text, myName = "OpenClaw") {
    const lower = text.toLowerCase();
    
    // Heuristic 1: Targeting
    let target = "nobody";
    if (lower.includes(`@${myName.toLowerCase()}`) || lower.includes(myName.toLowerCase())) {
        target = "me";
    } else if (text.includes("@")) {
        target = "specific_user";
    }

    // Heuristic 2: Intent
    let intent = "chit_chat";
    if (lower.includes("?") || lower.includes("怎么") || lower.includes("what")) intent = "question";
    if (lower.includes("run") || lower.includes("exec") || lower.includes("执行")) intent = "command";
    
    // Heuristic 3: Safety
    let safety = "safe";
    if (lower.includes("delete") || lower.includes("rm -rf") || lower.includes("format")) safety = "risky";

    return {
        intent,
        target,
        urgency: "medium",
        sentiment: "neutral",
        entities: [],
        safety,
        _note: "v1_heuristic_mode" // Mark as heuristic so we know to upgrade later
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
