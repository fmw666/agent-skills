# Agent Skills

A collection of high-impact skills for autonomous AI agents (OpenClaw compatible).

These skills are designed to enhance context awareness, evolution capability, and tool efficiency.

## Skills

### 🛡️ [Group Chat Sentinel](skills/group-chat-sentinel/SKILL.md)

**A mandatory context-awareness protocol for group chats.**

- **Purpose:** Prevents over-reaction and ensures precise, relevant responses in multi-user environments.
- **Features:**
    - **Three Gates of Silence:** Identity Check, Value Check, Response Strategy.
    - **RLHF:** Built-in feedback loop (👍/🤫) for continuous improvement.
    - **Nightly Review:** Automated log analysis for self-reflection.
- **Integration:** Requires adding a mandatory check in your agent's system prompt or `AGENTS.md`.

---

## Usage

1. Clone this repository into your agent's workspace:
   ```bash
   git clone https://github.com/<your-username>/agent-skills.git skills/agent-skills
   ```

2. Reference the skill in your `AGENTS.md` or system prompt:
   ```markdown
   Before responding, consult: skills/agent-skills/skills/group-chat-sentinel/SKILL.md
   ```

## Contributing

Pull requests are welcome! If you have a skill that makes agents smarter, please share it.

## License

MIT
