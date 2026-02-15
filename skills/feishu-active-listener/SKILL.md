---
name: feishu-active-listener
description: Analyzes group chat messages to detect social engagement opportunities without mentions. Returns structured analysis for the Sentinel protocol.
usage: node index.js '<json_message_object>'
---

# Feishu Active Listener (飞书主动监听器)

This skill implements the "Active Listener" pattern, allowing the bot to detect and respond to social cues in group chats without requiring explicit mentions. It works in tandem with the `group-chat-sentinel` to ensure high-quality, non-intrusive engagement.

## 🚀 Setup & Configuration

### 1. Feishu Permissions
To receive all group messages (not just mentions), your Feishu App needs:
- **Scope:** `im:message.group_msg:read` (Read group messages)
- **Scope:** `im:message:read` (Read messages)

### 2. OpenClaw Gateway Config
In your Gateway configuration (or `openclaw.config.json`):
- Set `requireMention: false` for the Feishu channel.
- This enables the stream of all group messages to reach the bot.

### 3. Skill Configuration (`config.json`)
Edit `/home/node/.openclaw/workspace/skills/feishu-active-listener/config.json`:

```json
{
  "botId": "cli_a7fb...",        // Your Bot's Open ID
  "socialKeywords": ["哈哈", "cool"], // Keywords to trigger social replies
  "taskKeywords": ["help", "run"],    // Keywords to AVOID (leave for explicit tasks)
  "ignoreBots": true             // Ignore other bots to prevent loops
}
```

## 🧠 Logic Flow

1.  **Identity Gate:** Ignores own messages and other bots.
2.  **Anti-Hijack:** Ignores messages that `@mention` other people.
3.  **Task Filter:** Ignores messages containing "task words" (e.g., "draw", "code") to avoid stealing complex tickets.
4.  **Social Trigger:** If a "social keyword" is found (e.g., "congrats", "lol"), signals a `REPLY` opportunity.

## 🤝 Integration with Sentinel

This skill acts as a **Sensor** for the **Sentinel**.

1.  **Input:** Raw message stream.
2.  **Active Listener:** Filters noise, identifies potential hits.
3.  **Sentinel:** Decides *whether* to act on that hit based on context, mood, and frequency limits.

## 📝 Usage Example

```bash
node index.js '{"content": "哈哈，太强了", "senderId": "ou_123", "senderType": "user", "mentionsMe": false, "mentionsOthers": []}'
```

**Output:**
```json
{
  "action": "REPLY",
  "reason": "Social keyword detected",
  "suggestion": "DETECTED_SOCIAL_OPPORTUNITY"
}
```
