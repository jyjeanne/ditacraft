---
type: TypeScript Method
title: getApiKeySource
resource: src/llm/secretManager.ts#L34-L39
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/commands/configureAICommand/AiSettingsPanel/handle
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/configureAICommand/AiSettingsPanel/post
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async getApiKeySource(provider: string): Promise<'stored' | 'env' | undefined>`

# Called by

- [handle](../../../../../functions/src/commands/configureAICommand/AiSettingsPanel/handle.md)
- [post](../../../../../functions/src/commands/configureAICommand/AiSettingsPanel/post.md)