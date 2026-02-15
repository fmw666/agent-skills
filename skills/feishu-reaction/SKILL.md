---
name: feishu-reaction
description: Adds emoji reactions to Feishu messages using the Open API. Use when the native `message` tool's reaction is unavailable or fails.
usage: node index.js '<json_params>'
---

# Feishu Reaction Skill (飞书表情回应)

This skill allows the bot to add emoji reactions to Feishu messages using the Open API. It bypasses the limitations of the native `message` tool for Feishu reactions by directly invoking the Feishu API.

## 🚀 Setup & Configuration

### 1. Feishu Permissions (Critical!)
To use this skill, your Feishu App MUST have the following permission enabled in the Developer Console:
- **Scope:** `im:message.reactions:write_only` (Create reactions / 给消息添加表情回复)
- **Note:** You must create a new app version and publish it for permission changes to take effect.

### 2. Configuration (`config.json`)
Create `config.json` in the skill directory based on `config.example.json`:

```json
{
  "appId": "cli_xxx",        // Your Bot's App ID
  "appSecret": "xxx"         // Your Bot's App Secret
}
```

> **Security Note:** Do not commit `config.json` with real credentials if publishing publicly!
> **Fallback:** You can also set `FEISHU_APP_ID` and `FEISHU_APP_SECRET` as environment variables.

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

## ⚠️ Troubleshooting & Pitfalls (FAQ)

### 1. Error: `Invalid parameter type in json: reaction_type` (Code 9499)
- **Cause:** You might be sending the emoji type as a simple string.
- **Fix:** The API requires a nested object structure: `{"reaction_type": {"emoji_type": "THUMBSUP"}}`. This skill handles this automatically, but ensure your `emojiType` input is just the string (e.g., `"THUMBSUP"`).

### 2. Error: `No permission` or `Access denied`
- **Cause:** The app lacks the `im:message.reactions:write_only` permission.
- **Fix:** Go to Feishu Developer Console -> Permissions -> Search "reaction" -> Add `im:message.reactions:write_only` -> **Create Version & Publish**.

### 3. Error: `Invalid parameter value: "thumbsup"`
- **Cause:** Emoji types are **case-sensitive** and usually UPPERCASE.
- **Fix:** Use `THUMBSUP`, not `thumbsup`. Refer to the official list.

### 4. Error: `HTTP Error: 400 Bad Request` (Token invalid)
- **Cause:** `appId` or `appSecret` is incorrect, or the token expired (the script fetches a new one each run, so expiration is unlikely unless the credentials are wrong).
- **Fix:** Check `config.json` or environment variables.

### 5. Reaction doesn't appear?
- **Cause:** Feishu limits specific emojis or the message might be too old / deleted.
- **Check:** Ensure the `messageId` is correct and exists.

## 🧪 Valid Emoji List (Partial)
- `THUMBSUP` (👍)
- `HEART` (❤️)
- `OK` (👌)
- `APPLAUSE` (👏)
- `MUSCLE` (💪)
- `FINGERHEART` (🫰)
- ...and many more.
