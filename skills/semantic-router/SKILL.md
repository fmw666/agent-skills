---
name: semantic-router
description: A core cognitive service that analyzes text intent, target, and safety. Use this as a dependency for Sentinel or any skill needing NLU.
usage: node index.js '<text>' [my_name]
---

# 🧠 Semantic Router

The centralized "Brain" for intent classification. Instead of letting every skill guess what the user means, they all ask the Router.

## 📦 Capabilities

1.  **Intent Classification:** Distinguishes between Questions, Commands, and Chit-chat.
2.  **Target Resolution:** Determines who the message is for (Me, You, Everyone).
3.  **Safety Gate:** basic heuristic check for dangerous keywords.

## 🚀 Usage

### As a Library
```javascript
const { route } = require('../semantic-router');
const analysis = route("Hey OpenClaw, delete all files!", "OpenClaw");
// Returns: { intent: "command", target: "me", safety: "risky" }
```

### As a CLI
```bash
node skills/semantic-router/index.js "Who is the president?" "OpenClaw"
```

## ⚠️ Limitations (v1)
Currently uses **Heuristics (Regex)** for speed and offline reliability.
Future versions will integrate with Embeddings or LLM API for deeper understanding.
