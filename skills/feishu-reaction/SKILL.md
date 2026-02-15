# Feishu Reaction Skill (飞书表情回应) v1.1.0

This skill allows the bot to add emoji reactions to Feishu messages using the Open API. It bypasses the limitations of the native `message` tool for Feishu reactions by directly invoking the Feishu API.

**✨ New in v1.1.0:** Token Caching! The skill now caches the `tenant_access_token` in `token.json` to reduce API calls and latency.

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
- `list` (optional, boolean): If `true`, returns the list of all valid emoji types instead of reacting.

## 🧠 How it Works

1.  **Token Management:** 
    - Checks `token.json` for a valid cached token.
    - If expired or missing, requests a new `tenant_access_token` from Feishu.
    - Caches the new token with its expiration time (minus a safety buffer).
2.  **Call API:** Sends a `POST` request to `https://open.feishu.cn/open-apis/im/v1/messages/:message_id/reactions` with the specified emoji type.

## ⚠️ Limitations & FAQ

### 1. Can I react multiple times with the same emoji? (e.g. +5 Likes)
**No.** Feishu's reaction system is binary per user per emoji.
- A single user (or Bot) can only react **once** per emoji type on a message.
- You cannot achieve "+5" count alone.
- **Workaround:** You *can* react with 5 *different* emojis (e.g., 👍 + ❤️ + 👏 + 🔥 + 💯) to show high enthusiasm.

### 2. How do I know which Emojis are supported?
Run the skill with `{"list": true}` to get the full supported list, or refer to the "Valid Emoji List" below.

### 3. Find Latest Message ID
If you don't know the `messageId`, you can ask the skill to find the latest message in a chat:

```bash
node index.js '{"findLatest": true, "chatId": "oc_..."}'
```
**Output:** `{"status": "success", "messageId": "om_..."}`

### 4. List Supported Emojis
- **Cause:** You might be sending the emoji type as a simple string.
- **Fix:** The API requires a nested object structure: `{"reaction_type": {"emoji_type": "THUMBSUP"}}`. This skill handles this automatically.

### 4. Error: `No permission` or `Access denied`
- **Cause:** The app lacks the `im:message.reactions:write_only` permission.
- **Fix:** Go to Feishu Developer Console -> Permissions -> Search "reaction" -> Add `im:message.reactions:write_only` -> **Create Version & Publish**.

## 🧪 Valid Emoji List (Common)
*Full list available via `{"list": true}` command.*

| Type | Emoji | Type | Emoji | Type | Emoji |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `THUMBSUP` | 👍 | `HEART` | ❤️ | `OK` | 👌 |
| `APPLAUSE` | 👏 | `MUSCLE` | 💪 | `FINGERHEART`| 🫰 |
| `FIRE` | 🔥 | `AWESOMEN` | 666 | `THUMBSDOWN` | 👎 |
| `SMILE` | 😀 | `LAUGH` | 😄 | `BLUSH` | 😊 |
| `SOB` | 😭 | `CRY` | 😢 | `ANGRY` | 😠 |
| `BETRAYED` | 🥀 | `ROSE` | 🌹 | `KISS` | 😚 |
| `WAVE` | 👋 | `FISTBUMP` | 👊 | `HIGHFIVE` | 🙌 |
