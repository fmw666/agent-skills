---
name: telegram-evolver-wrapper
description: "Telegram-integrated wrapper for the capability-evolver. ⚠️ MANDATORY: Before using this skill, you MUST consult `skills/evolution-protocol/SKILL.md` for safety rules and correct startup commands."
---

# Telegram Evolver Wrapper

A lightweight wrapper for the `capability-evolver` skill.
It injects the Telegram reporting environment variables to enable reporting in the Master's environment.

## Usage

```bash
# Run the evolution loop
node skills/telegram-evolver-wrapper/index.js

# Generate Evolution Dashboard (Markdown)
node skills/telegram-evolver-wrapper/report.js --dashboard

# Lifecycle Management (Start/Stop/Status/Ensure)
node skills/telegram-evolver-wrapper/lifecycle.js status
```

## Architecture

- **Evolution Loop**: Runs the GEP evolution cycle with Telegram reporting.
- **Social Reward Loop (v1.3)**:
  - Scans `memory/evolution_rewards.json` for recent human feedback.
  - Injects `EVOLVE_HINT` environment variable into the next evolution cycle.
  - Allows the agent to steer evolution based on social signals.
- **Dashboard**: Visualizing metrics and history from `assets/gep/events.jsonl`.
- **Export History**: Exports raw history.
- **Watchdog**: Managed via OpenClaw Cron job `evolver_watchdog_robust` (runs `lifecycle.js ensure` every 10 min).
  - Replaces fragile system crontab logic.
  - Ensures the loop restarts if it crashes or hangs.
