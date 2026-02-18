const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');

const MEMORY_DIR = path.resolve(__dirname, '../../memory');
const HEARTBEAT_FILE = path.join(MEMORY_DIR, 'evolution_heartbeat.json');
const SCRIPT_PATH = path.join(__dirname, 'index.js');
const LOG_FILE = path.join(MEMORY_DIR, 'evolution.log');

// Max heartbeat age: 10 minutes
const MAX_AGE_MS = 10 * 60 * 1000; 

function ensure() {
    console.log('[Lifecycle] Checking Evolution Loop status...');
    
    let isRunning = false;
    let isStale = false;
    let oldPid = null;

    if (fs.existsSync(HEARTBEAT_FILE)) {
        try {
            const data = JSON.parse(fs.readFileSync(HEARTBEAT_FILE, 'utf8'));
            oldPid = data.pid;
            const lastHeartbeat = data.timestamp;
            const now = Date.now();
            
            // Check if process exists and is not a zombie
            try {
                process.kill(oldPid, 0); // Check if process exists (signal 0)
                // Additional check for zombie state
                try {
                    const statusFile = fs.readFileSync(`/proc/${oldPid}/stat`, 'utf8');
                    const state = statusFile.split(' ')[2]; // 3rd field is state
                    if (state === 'Z') {
                        console.warn(`[Lifecycle] Process ${oldPid} is a zombie. Treating as dead.`);
                        isRunning = false;
                    } else {
                        isRunning = true;
                    }
                } catch (e) {
                    // Fallback if /proc not available (non-Linux?)
                    isRunning = true;
                }
            } catch (e) {
                isRunning = false;
            }

            // Check freshness
            if (now - lastHeartbeat > MAX_AGE_MS) {
                isStale = true;
                console.warn(`[Lifecycle] Heartbeat stale! Last seen: ${(now - lastHeartbeat)/1000}s ago.`);
            }
        } catch (e) {
            console.warn('[Lifecycle] Heartbeat file corrupted or unreadable.');
        }
    }

    if (isRunning && !isStale) {
        console.log('[Lifecycle] Evolution Loop is healthy and running (PID: ' + oldPid + ').');
        return;
    }

    if (isRunning && isStale) {
        console.log('[Lifecycle] Process exists but is stuck. Killing PID: ' + oldPid);
        try {
            process.kill(oldPid, 'SIGKILL');
        } catch (e) {
            console.error('[Lifecycle] Failed to kill stuck process:', e.message);
        }
    }

    start();
}

function start() {
    console.log('[Lifecycle] Starting new Evolution Loop...');
    
    const out = fs.openSync(LOG_FILE, 'a');
    const err = fs.openSync(LOG_FILE, 'a');

    const subprocess = spawn(process.argv[0], [SCRIPT_PATH], {
        detached: true,
        stdio: ['ignore', out, err],
        env: process.env // Inherit env
    });

    subprocess.unref();

    console.log(`[Lifecycle] Started with PID: ${subprocess.pid}`);
    
    // Write initial heartbeat immediately so we don't race
    const initialHeartbeat = {
        timestamp: Date.now(),
        pid: subprocess.pid,
        status: 'starting',
        cycle: '0'
    };
    fs.writeFileSync(HEARTBEAT_FILE, JSON.stringify(initialHeartbeat));
}

function status() {
    if (fs.existsSync(HEARTBEAT_FILE)) {
        const data = JSON.parse(fs.readFileSync(HEARTBEAT_FILE, 'utf8'));
        const age = (Date.now() - data.timestamp) / 1000;
        console.log(`[Status] PID: ${data.pid}, Age: ${age.toFixed(1)}s, Cycle: ${data.cycle}`);
    } else {
        console.log('[Status] No heartbeat file found.');
    }
}

// CLI Routing
const command = process.argv[2];
if (command === 'ensure') {
    ensure();
} else if (command === 'status') {
    status();
} else if (command === 'start') { // Force start
    start();
} else {
    console.log('Usage: node lifecycle.js [ensure|status|start]');
}
