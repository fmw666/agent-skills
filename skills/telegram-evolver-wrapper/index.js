const fs = require('fs');
const path = require('path');
const { sendReport } = require('./telegram-helper');
const evolve = require('evolver/src/evolve');

console.log('[Wrapper] Starting (v1.3 Restoration)...');

// --- Configuration (v1.3 Dynamic Config) ---
const MEMORY_DIR = path.resolve(__dirname, '../../memory');
const CONFIG_FILE = path.join(MEMORY_DIR, 'evolution_config.json');
const HEARTBEAT_FILE = path.join(MEMORY_DIR, 'evolution_heartbeat.json');
const REWARDS_FILE = path.join(MEMORY_DIR, 'evolution_rewards.json');

// Default Config
let currentConfig = {
    log_target: process.env.LOG_TARGET || process.env.EVOLVE_REPORT_TARGET || ''
};

function loadConfig() {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            const fileConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
            // Merge with defaults/env
            currentConfig = { 
                ...currentConfig, 
                ...fileConfig 
            };
            // Ensure log_target is updated if present in file
            if (fileConfig.log_target) {
                currentConfig.log_target = fileConfig.log_target;
                // Update env for evolver to see
                process.env.EVOLVE_REPORT_TARGET = currentConfig.log_target;
            }
        }
    } catch (e) {
        console.warn('[Wrapper] Config load failed:', e.message);
    }
    return currentConfig;
}

// --- Heartbeat Logic (v1.3 Overseer Contract) ---
function pulse() {
    try {
        const data = {
            timestamp: Date.now(),
            pid: process.pid,
            status: 'running',
            cycle: process.env.EVOLVE_CYCLE_COUNT || 'unknown',
            config_hash: JSON.stringify(currentConfig).length
        };
        fs.writeFileSync(HEARTBEAT_FILE, JSON.stringify(data));
    } catch (e) {
        console.error('[Wrapper] Failed to pulse heartbeat:', e.message);
    }
}

// --- Feedback Loop Injection (Phase 4) ---
function getFeedbackHint() {
    try {
        if (!fs.existsSync(REWARDS_FILE)) return null;
        const rewards = JSON.parse(fs.readFileSync(REWARDS_FILE, 'utf8'));
        
        // Find recent positive feedback (last 24h)
        const now = Date.now();
        const recent = rewards.history.filter(r => (now - r.timestamp) < 86400000);
        
        if (recent.length === 0) return null;
        
        // Calculate score
        const score = recent.reduce((sum, r) => sum + r.score, 0);
        const topFeedback = recent.sort((a,b) => b.score - a.score)[0];
        
        return `User Feedback Context: Recent score is ${score}. Top feedback: "${topFeedback.reason}" on cycle #${topFeedback.cycle}. Focus on similar high-value improvements.`;
    } catch (e) {
        console.warn('[Wrapper] Failed to read feedback:', e.message);
        return null;
    }
}

async function runLoop() {
    let cycleCount = 0;
    
    // Initial Config Load & Alert
    loadConfig();
    const target = currentConfig.log_target || 'Unknown';
    console.log(`[Wrapper] Target: ${target}`);
    
    // Initial Pulse
    pulse();
    
    if (target.startsWith('-') || !target.startsWith('oc_')) {
        await sendReport({
            title: "🧬 Evolver Loop Started",
            status: "Evolution Protocol v1.3 active.",
            details: "Feedback loop integrated.",
            color: "green"
        });
    }

    while (true) {
        cycleCount++;
        process.env.EVOLVE_CYCLE_COUNT = String(cycleCount);
        
        // 1. Refresh Config
        loadConfig();
        
        // 2. Pulse Heartbeat
        pulse();
        
        // 3. Prepare Hint (Social Reward)
        const feedbackHint = getFeedbackHint();
        if (feedbackHint) {
            console.log(`[Wrapper] Injecting feedback hint: ${feedbackHint}`);
            // Inject into process.env so Evolver picks it up (Evolver needs to support EVOLVE_HINT env var)
            // If Evolver doesn't support it yet, we might need to patch Evolver or write a hint file.
            // For now, assuming Evolver v1.12+ supports EVOLVE_HINT or we just set it.
            process.env.EVOLVE_HINT = feedbackHint;
        } else {
            delete process.env.EVOLVE_HINT;
        }

        // 4. Run Cycle
        try {
            console.log(`[Wrapper] Starting Cycle #${cycleCount}...`);
            await evolve.run(); 
        } catch (e) {
            console.error(`[Wrapper] Cycle #${cycleCount} failed:`, e);
            // Don't crash the loop, just sleep and retry
        }
        
        // 5. Sleep (Dynamic)
        // Check for saturation signals from memory
        const sleepBase = 60000; // 1 minute default
        let sleepTime = sleepBase;
        
        console.log(`[Wrapper] Sleeping for ${sleepTime/1000}s...`);
        await new Promise(r => setTimeout(r, sleepTime));
    }
}

if (require.main === module) {
    runLoop();
}
