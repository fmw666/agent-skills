#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const os = require('os');
const { program } = require('commander');
const { execSync } = require('child_process');
const { sendReport: sendTelegramReport } = require('./telegram-helper.js');
const crypto = require('crypto');

// Check for integration key (TELEGRAM_BOT_TOKEN)
const integrationKey = process.env.TELEGRAM_BOT_TOKEN;
if (!integrationKey) {
  console.warn('⚠️ Integration key missing (TELEGRAM_BOT_TOKEN). Reporting might fail or degrade to console only.');
}

// --- REPORT DEDUP ---
const DEDUP_FILE = path.resolve(__dirname, '../../memory/report_dedup.json');
const DEDUP_WINDOW_MS = 30 * 60 * 1000; // 30 minutes

function isDuplicateReport(reportKey) {
    if (process.env.EVOLVE_REPORT_DEDUP === '0') return false;
    try {
        var cache = {};
        if (fs.existsSync(DEDUP_FILE)) {
            cache = JSON.parse(fs.readFileSync(DEDUP_FILE, 'utf8'));
        }
        var now = Date.now();
        for (var k in cache) {
            if (now - cache[k] > DEDUP_WINDOW_MS) delete cache[k];
        }
        if (cache[reportKey]) {
            console.log('[Wrapper] Report dedup: skipping duplicate report (' + reportKey.slice(0, 40) + '...)');
            return true;
        }
        cache[reportKey] = now;
        var tmpDedup = DEDUP_FILE + '.tmp.' + process.pid;
        fs.writeFileSync(tmpDedup, JSON.stringify(cache, null, 2));
        fs.renameSync(tmpDedup, DEDUP_FILE);
        return false;
    } catch (e) {
        return false;
    }
}

// --- DASHBOARD LOGIC START ---
const EVENTS_FILE = path.resolve(__dirname, '../../assets/gep/events.jsonl');

function getDashboardStats() {
    if (!fs.existsSync(EVENTS_FILE)) return null;
    try {
        const content = fs.readFileSync(EVENTS_FILE, 'utf8');
        const lines = content.split('\n').filter(Boolean);
        const events = lines.map(l => { try { return JSON.parse(l); } catch(e){ return null; } }).filter(e => e && e.type === 'EvolutionEvent');
        if (events.length === 0) return null;
        const total = events.length;
        const successful = events.filter(e => e.outcome && e.outcome.status === 'success').length;
        const successRate = ((successful / total) * 100).toFixed(1);
        const recent = events.slice(-5).reverse().map(e => ({
            id: e.id.replace('evt_', '').substring(0, 6),
            intent: e.intent === 'innovate' ? '✨' : (e.intent === 'repair' ? '🔧' : '⚡'),
            status: e.outcome && e.outcome.status === 'success' ? '✅' : '❌'
        }));
        return { total, successRate, recent };
    } catch (e) {
        return null;
    }
}

// --- SYSTEM MONITOR ---
let sysMon;
try {
    sysMon = require('../common/system-monitor/index.js');
} catch (e) {
    sysMon = {
        getProcessCount: () => { try { return execSync('ps -e | wc -l').toString().trim(); } catch(e){ return '?'; } },
        getDiskUsage: (mount) => { try { return execSync(`df -h "${mount || '/'}" | tail -1 | awk '{print $5}'`).toString().trim(); } catch(e){ return '?'; } },
        getLastLine: (f) => { try { return fs.readFileSync(f, 'utf8').trim().split('\n').pop(); } catch(e){ return ''; } }
    };
}

const STATE_FILE = path.resolve(__dirname, '../../memory/evolution_state.json');

function getCycleInfo(explicitId) {
    if (explicitId) return { id: explicitId, duration: 'Manual' };
    let nextId = 1;
    try {
        if (fs.existsSync(STATE_FILE)) {
            const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
            if (state.lastCycleId) nextId = state.lastCycleId + 1;
        }
    } catch (e) {}
    return { id: nextId, duration: 'Auto' };
}

async function sendReport(options) {
    // Resolve content
    let content = options.status || options.content || '';
    if (options.file) {
        try { content = fs.readFileSync(options.file, 'utf8'); } catch (e) { console.error(`Failed to read file: ${options.file}`); }
    }

    // Prepare Title
    const cycleInfo = getCycleInfo(options.cycle);
    const cycleId = cycleInfo.id;
    let title = options.title || `🧬 Evolution #${cycleId}`;

    // Resolve Target
    let target = options.target || process.env.TELEGRAM_CHAT_ID;
    if (!target) {
        console.error('No target ID found (Env TELEGRAM_CHAT_ID missing and no --target).');
        return;
    }

    // --- DASHBOARD SNAPSHOT ---
    let dashboardMd = '';
    const stats = getDashboardStats();
    if (stats) {
        const trend = stats.recent.map(e => `${e.intent}${e.status}`).join(' ');
        dashboardMd = `\n\n**Dashboard:**\n- Success: ${stats.successRate}% (${stats.total})\n- Recent: ${trend}`;
    }

    // Stats
    let procCount = '?', memUsage = '?', uptime = '?', loadAvg = '?', diskUsage = '?';
    try {
        procCount = sysMon.getProcessCount();
        memUsage = Math.round(process.memoryUsage().rss / 1024 / 1024);
        uptime = Math.round(process.uptime());
        loadAvg = os.loadavg()[0].toFixed(2);
        diskUsage = sysMon.getDiskUsage('/');
    } catch(e) {}
    
    let footerStats = `Proc: ${procCount} | Mem: ${memUsage}MB | Up: ${uptime}s | Load: ${loadAvg} | Disk: ${diskUsage}`;

    const finalContent = `${content}${dashboardMd}\n\n\`${footerStats}\``;

    // --- DEDUP CHECK ---
    var statusHash = crypto.createHash('md5').update(options.status || '').digest('hex').slice(0, 12);
    var reportKey = `${cycleId}:${target}:${title}:${statusHash}`;
    if (isDuplicateReport(reportKey)) {
        console.log('[Wrapper] Duplicate report suppressed.');
        return;
    }

    // Determine color/status emoji
    let color = options.color || 'blue';
    const statusUpper = (options.status || '').toUpperCase();
    if (statusUpper.includes('SUCCESS')) color = 'green';
    else if (statusUpper.includes('FAIL')) color = 'red';
    else if (statusUpper.includes('WARN')) color = 'yellow';

    try {
        console.log(`[Wrapper] Reporting Cycle #${cycleId} to ${target}...`);
        await sendTelegramReport({
            title: title,
            status: content, // sendTelegramReport uses status as main text
            details: dashboardMd + `\n\n\`${footerStats}\``,
            color: color
        });
        console.log('[Wrapper] Report sent successfully.');
    } catch (e) {
        console.error('[Wrapper] Report failed:', e.message);
    }
}

// CLI Logic
if (require.main === module) {
    program
      .option('-s, --status <text>', 'Status text/markdown content')
      .option('--content <text>', 'Alias for --status')
      .option('-f, --file <path>', 'Path to markdown file content')
      .option('-c, --cycle <id>', 'Evolution Cycle ID')
      .option('--title <text>', 'Card Title override')
      .option('--color <color>', 'Header color')
      .option('--target <id>', 'Target User/Chat ID')
      .option('--dashboard', 'Include dashboard stats')
      .parse(process.argv);

    const options = program.opts();
    sendReport(options).catch(err => {
        console.error('[Wrapper] Report failed (non-fatal):', err.message);
        process.exit(0);
    });
}

module.exports = { sendReport };
