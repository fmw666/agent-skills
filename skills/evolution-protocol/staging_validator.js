/**
 * Staging Validator (Gene Lock)
 * 
 * Runs before Git Sync to ensure the "Staged" changes are valid.
 * If validation fails, it reverts the changes to protect the repo.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function validate() {
    console.log('[Validator] 🛡️ Inspecting staged changes...');

    // 1. Get list of modified files
    let status;
    try {
        status = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
    } catch (e) {
        console.error('[Validator] Failed to check git status:', e.message);
        return false; // Fail safe
    }

    if (!status) {
        console.log('[Validator] No changes to validate.');
        return true;
    }

    const files = status.split('\n').map(line => line.substring(3).trim());
    const jsFiles = files.filter(f => f.endsWith('.js'));

    // 2. Syntax Check (node -c)
    let errors = 0;
    for (const file of jsFiles) {
        if (!fs.existsSync(file)) continue; // Deleted file
        try {
            execSync(`node -c "${file}"`, { stdio: 'ignore' });
        } catch (e) {
            console.error(`[Validator] ❌ Syntax Error in ${file}`);
            errors++;
        }
    }

    if (errors > 0) {
        console.error(`[Validator] 🛑 Validation Failed: ${errors} syntax errors detected.`);
        // Revert changes! (Gene Lock Strategy)
        // CRITICAL FIX: Do NOT use 'git clean -fd' as it deletes untracked root files (e.g. AGENTS.md).
        // Only restore tracked files. The user can manually clean untracked garbage if needed.
        console.log('[Validator] 🔙 Reverting modified files to protect integrity...');
        try {
            execSync('git restore .', { stdio: 'inherit' });
            // Optional: If we really want to clean new files, we must be specific.
            // For now, safety first: leave untracked files alone.
        } catch (e) {
            console.error('[Validator] 💀 Revert Failed! Manual intervention required.');
        }
        return false;
    }

    console.log('[Validator] ✅ All checks passed. Proceeding to promotion.');
    return true;
}

if (require.main === module) {
    if (!validate()) process.exit(1);
}

module.exports = { validate };
