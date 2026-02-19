---
name: feishu-reaction
description: 向飞书消息发送表情回复 (Emoji Reaction)。支持 181 种全量飞书表情，内置 Token 缓存与自动纠错。适用于需要情感互动、状态确认 (OK/DONE) 或任务反馈的场景。
---

# 飞书表情奥义 (feishu-reaction)

> **注意：此文档供 AI 助手使用。**
> 当你需要向范大哥（用户）的消息表达认可、确认或情感回应时，请使用此技能。

## 关键信息 (Critical)
- **官方参考**: [飞书表情代码全表](https://open.feishu.cn/document/server-docs/im-v1/message-reaction/emojis-introduce)
- **核心逻辑**: 直接调用飞书原生 API，规避标准工具字段缺失的限制。
- **回复准则**: 始终采用 `emoji_type (中文解释)` 格式，确保语义清晰。

## 快速入门 (3-Minute Quickest Path)

### 第一步：定位消息 ID
从会话元数据中提取 `messageId` (例如 `om_x100b...`)。

### 第二步：选择表情代码
从 181 个可用代码中选择最贴切的一个。常用招式：
- `DONE` (完成/已阅)
- `THUMBSUP` (点赞/赞同)
- `OK` (确认/没问题)
- `PRAY` (双手合十/拜托)
- `WULIN` (抱拳/客气)

### 第三步：执行动作
使用 `exec` 调用本地脚本：
```bash
node skills/feishu-reaction/index.js '{"messageId": "om_...", "emojiType": "DONE"}'
```

## 运行准则 (Operational Principles)
- **全集中·大写**: 脚本会自动转换小写输入，但建议直接使用全大写（如 `DONE`）。
- **全集中·守恒**: 不要对同一消息重复发送相同表情，以免触发 API 幂等性报错。
- **全集中·温情**: 在执行完 Reaction 后，建议给范大哥一个温和的文字确认，并带上括号里的中文解释。

## 参数规范
- `messageId`: (必填) 飞书消息唯一 ID。
- `emojiType`: (必填) 飞书定义的英文表情代码。
- `list`: (可选) 传入 `{"list": true}` 可查询本地支持的所有 181 个代码映射。

---
*由灶门炭治郎精进，致力于建立最深厚的助手羁绊。*
