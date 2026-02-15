---
name: feishu-recall
description: Recalls a message sent by the bot within a specific time window (usually 24h).
usage: node index.js '<json_params>'
---

# Feishu Recall Skill (飞书消息撤回)

This skill allows the bot to recall (delete) its own messages using the Feishu Open API.

## 🚀 Setup & Configuration

### 1. Feishu Permissions (Critical!)
To use this skill, your Feishu App MUST have the following permission enabled:
- **Scope:** `im:message:recall` (Recall messages / 撤回消息)
- **Note:** Publish a new app version after adding permissions.

### 2. Configuration (`config.json`)
Create `config.json` in the skill directory based on `config.example.json`:

```json
{
  "appId": "cli_xxx",
  "appSecret": "xxx"
}
```

## 📝 Usage

```bash
node index.js '{"messageId": "om_123456..."}'
```

### Parameters:
- `messageId` (required): The ID of the message to recall.

## 🧠 How it Works
1.  **Token Management:** Uses cached `tenant_access_token` (shared mechanism with other skills).
2.  **Call API:** Sends a `DELETE` request to `https://open.feishu.cn/open-apis/im/v1/messages/:message_id`.

## ⚠️ Limitations
- **Time Limit:** Can only recall messages sent within a specific time window (usually 24 hours, depends on tenant settings).
- **Ownership:** Can only recall messages sent by the bot itself.
