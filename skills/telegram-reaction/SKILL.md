# Telegram Reaction Skill

This skill allows the agent to add emoji reactions to Telegram messages.

## Usage

```bash
# React to a specific message
openclaw message --action react --channel telegram --messageId <message_id> --emoji <emoji>
```

## Examples

```bash
# Thumbs up
openclaw message --action react --channel telegram --messageId 12345 --emoji "👍"

# Fire
openclaw message --action react --channel telegram --messageId 12345 --emoji "🔥"
```

## Notes

- Telegram only supports specific emojis for reactions. Common ones: 👍 👎 ❤️ 🔥 🎉 👏 😁 🤔 🤯 😱 🤬 😢 🤮 💩 🙏
- Reaction support depends on group settings.
