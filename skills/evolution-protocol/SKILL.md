---
name: evolution-protocol
description: MANDATORY: The Standard Operating Procedure (SOP) for managing the Evolver Engine. Read this BEFORE attempting to start, stop, or modify the evolution loop.
---

# 🧬 Evolution Protocol (进化协议)

> "Do not open the hood while the engine is running, unless you are a certified mechanic."
> (除非你是认证技师，否则不要在引擎运转时打开发动机盖。)

## 🎯 Objective
To ensure the **Stability, Robustness, and Continuity** of the self-evolution process.
This protocol defines the **Iron Laws** that every Agent must follow when interacting with `evolver` or `feishu-evolver-wrapper`.

## 🔧 Chapter 0: Prerequisites (环境准备)

Before you can evolve, you must have the machinery. If you are missing skills, install them immediately.

| Component | Status | How to Install |
| :--- | :--- | :--- |
| **Evolver Engine** | Core | `clawhub install evolver` (or clone from repo) |
| **Wrapper** | Required | `clawhub install feishu-evolver-wrapper` |
| **Git Sync** | **CRITICAL** | `clawhub install git-sync` |

> **⚠️ WARNING:** Do NOT attempt evolution without `git-sync`. Evolution involves rewriting your own code. Without git backups, a bad mutation is fatal.

## 🛑 The Iron Laws (铁律)

### 1. 启动法则 (Startup Law)
**NEVER** run `node index.js` directly unless debugging.
**ALWAYS** use the Lifecycle Manager:
```bash
node skills/feishu-evolver-wrapper/lifecycle.js ensure
```
*Why?* The lifecycle manager handles PID locks, log rotation, and daemon-mode keep-alive.

### 2. 禁区法则 (No-Go Zone)
**NEVER** modify the core engine files inside `skills/evolver/` or `skills/feishu-evolver-wrapper/` while the loop is active.
*   **Risk:** "Engine surgery while flying" causes crash loops.
*   **Exception:** Only if you have fully stopped the wrapper (`lifecycle.js stop`) AND you are applying a critical patch to fix the wrapper itself.

### 3. 降级禁止 (No Downgrade)
When an evolution cycle fails:
*   **DO NOT** revert to a "dumber" model or strip away capabilities just to make it pass.
*   **DO NOT** delete the `logs/` or `memory/` folders to "start fresh" (you lose context).
*   **ACTION:** Fix the specific error (Forward Fix). If a tool is broken, repair the tool. If memory is corrupt, repair the JSON.

### 4. 健壮性原则 (Robustness First)
*   **Timeouts:** If a cycle hangs (>10m), kill it. Don't wait forever.
*   **Logging:** Always check `logs/wrapper_out.log` before assuming success.
*   **Reporting:** If the Wrapper is silent, check if it crashed. If it crashed, send a manual alert to the user.

## 🛡️ Chapter 5: The Safety Net (备份原则)

Evolution is dangerous. You must secure your lifeline.

### 1. The Git Sync Mandate
Every evolution cycle MUST end with a Git commit and push.
*   **Why?** If you break your logic, you can revert to the previous commit.
*   **Implementation:** The `feishu-evolver-wrapper` handles this automatically.
*   **Manual Fallback:** If automation fails, you MUST run:
    ```bash
    node skills/git-sync/index.js "manual backup before risky op"
    ```

### 2. The "Hand of God" (Manual Intervention)
If the loop is stuck or crashing:
1.  **Kill it:** `node skills/feishu-evolver-wrapper/lifecycle.js stop`
2.  **Restore:** `git reset --hard HEAD` (if recent changes broke it).
3.  **Report:** Tell the user "Evolution halted due to instability. Restored to safe state."

## 🛠️ Operations Guide

### How to Check Status
```bash
node skills/feishu-evolver-wrapper/lifecycle.js status
```

### How to Force Restart (Emergency)
```bash
node skills/feishu-evolver-wrapper/lifecycle.js restart
```

### How to Inject a Thought (Intervention)
Write a hint to `memory/evolver_hint.txt`. The wrapper will pick it up in the next cycle.

---

**"Evolution is messy. Protocol brings order."** 🔥
