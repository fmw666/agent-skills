---
name: feishu-reaction
description: Adds emoji reactions to Feishu messages using the Open API. Use when the native `message` tool's reaction is unavailable or fails.
usage: node index.js '<json_params>'
---

# Feishu Reaction Skill (飞书表情回应)

This skill allows the bot to add emoji reactions to Feishu messages using the Open API. It bypasses the limitations of the native `message` tool for Feishu reactions by directly invoking the Feishu API.

## 🚀 Setup & Configuration

### 1. Feishu Permissions
To use this skill, your Feishu App needs the following permission:
- **Scope:** `im:message.reactions:write_only` (Create reactions)

### 2. Configuration (`config.json`)
Create or edit `config.json` in the skill directory:

```json
{
  "appId": "cli_xxx",        // Your Bot's App ID
  "appSecret": "xxx"         // Your Bot's App Secret
}
```

> **Note:** Do not commit `config.json` with real credentials if publishing publicly!

## 📝 Usage

Execute the skill by passing a JSON string with the `messageId` and `emojiType`.

```bash
node index.js '{"messageId": "om_123456...", "emojiType": "THUMBSUP"}'
```

### Parameters:
- `messageId` (required): The ID of the message to react to (e.g., `om_...`).
- `emojiType` (required): The emoji type string (e.g., `THUMBSUP`, `HEART`, `OK`, `APPLAUSE`). See [Feishu Emoji List](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/im-v1/message-reaction/emojis-introduce).

## 🧠 How it Works

1.  **Get Token:** Obtains a `tenant_access_token` using the configured App ID and Secret.
2.  **Call API:** Sends a `POST` request to `https://open.feishu.cn/open-apis/im/v1/messages/:message_id/reactions` with the specified emoji type.

## ⚠️ Limitations
- Only supports emoji types defined by Feishu.
- Reaction permissions must be granted to the bot.
