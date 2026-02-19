---
name: feishu-reaction
description: 向飞书消息发送表情回复 (Emoji Reaction)。支持 181 种全量飞书表情，内置 Token 缓存与自动纠错。适用于需要情感互动、状态确认 (OK/DONE) 或任务反馈的场景。
---

# 飞书表情回复技能 (feishu-reaction)

> **注意：此文档供 AI 助手阅读。**
> 当你需要向用户发送的消息表达认可、确认、情感回应或任务状态反馈时，请使用此技能。

## 关键信息 (Critical)
- **官方参考**: [飞书表情代码全表](https://open.feishu.cn/document/server-docs/im-v1/message-reaction/emojis-introduce)
- **核心逻辑**: 通过调用飞书原生 API 直接向指定消息添加 Reaction，规避常规消息工具的局限性。
- **回复准则**: 建议在表情操作成功后，在回复文本中采用 `emoji_type (中文解释)` 格式（如：`THUMBSUP (点赞)`），以确保跨平台语义清晰。

## 快速入门 (3-Minute Quickest Path)

### 第一步：定位消息 ID
从当前会话的元数据或上下文中提取目标消息的 `messageId` (例如 `om_x100b...`)。

### 第二步：选择表情代码
根据上下文从飞书支持的 181 个表情代码中选择最贴切的一个。
- **任务确认**: `DONE` (完成)、`OK` (确认)
- **正面反馈**: `THUMBSUP` (点赞)、`CELEBRATE` (庆祝)、`CLAP` (鼓掌)
- **情感交流**: `HEART` (爱心)、`THANKS` (感谢)、`SMILE` (微笑)

### 第三步：执行动作
使用 `exec` 工具调用技能脚本并传递 JSON 参数：
```bash
node skills/feishu-reaction/index.js '{"messageId": "om_...", "emojiType": "DONE"}'
```

## 运行准则 (Operational Principles)
- **代码规范**: 脚本会自动处理大小写，但为保证严谨性，建议输入全大写代码。
- **避免冗余**: 请勿对同一条消息重复发送完全相同的表情，以免触发 API 的报错。
- **用户反馈**: 执行完 Reaction 后，助手应提供简短的文字确认，告知用户已采取的操作及其含义。

## 参数规范
- `messageId`: (必填) 飞书消息的唯一标识符。
- `emojiType`: (必填) 飞书定义的英文表情代码字符串。
- `list`: (可选) 传入 `{"list": true}` 可查询本地支持的所有 181 个表情代码及其含义映射。

---
*本技能由通用 AI 协作协议优化，旨在提升飞书平台的人机交互体验。*
