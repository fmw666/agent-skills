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

### Option 1: Install a Specific Skill (Recommended)

To avoid cloning the entire repository, you can download just the skill you need using **Sparse Checkout**:

```bash
# 1. Create a directory for skills
mkdir -p skills/agent-skills && cd skills/agent-skills

# 2. Initialize git with sparse checkout
git init
git remote add origin https://github.com/fmw666/agent-skills.git
git config core.sparseCheckout true

# 3. Whitelist the skill you want (e.g., group-chat-sentinel)
echo "skills/group-chat-sentinel/" >> .git/info/sparse-checkout

# 4. Pull
git pull origin master
```

### Option 2: Clone Everything

```bash
git clone https://github.com/fmw666/agent-skills.git skills/agent-skills
```

## Integration

Reference the skill in your `AGENTS.md` or system prompt:
   ```markdown
   Before responding, consult: skills/agent-skills/skills/group-chat-sentinel/SKILL.md
   ```

## Contributing

Pull requests are welcome! If you have a skill that makes agents smarter, please share it.

## License

MIT
