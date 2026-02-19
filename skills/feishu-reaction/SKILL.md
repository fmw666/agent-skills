# 飞书表情奥义 (feishu-reaction)

> [!IMPORTANT]
> **全量表情指南：** [飞书表情列表官方文档](https://open.feishu.cn/document/server-docs/im-v1/message-reaction/emojis-introduce)
> 本技能已收录 181 个飞书专属表情代码。

## 核心招式
1. **精准打击**：直接调用飞书原生 API 发送 Reaction，规避常规工具限制。
2. **话术优化**：建议在回复中采用 \`emoji_type (解释)\` 格式，如 \`THUMBSUP (点赞)\`。

## 使用逻辑
- **参数**: \`{"messageId": "om_...", "emojiType": "DONE"}\`
- **反馈**: 成功后会返回表情代码及其对应的中文解释。

## 开发者笔记
- 代码路径：\`skills/feishu-reaction/index.js\`
- 特性：内置 Token 缓存、181 全量表情映射、自动纠错（全大写转换）。
