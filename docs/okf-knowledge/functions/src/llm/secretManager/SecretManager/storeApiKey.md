---
type: TypeScript Method
title: storeApiKey
resource: src/llm/secretManager.ts#L16-L18
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/commands/configureAICommand/AiSettingsPanel/handle
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async storeApiKey(provider: string, key: string): Promise<void>`

# Called by

- [handle](../../../../../functions/src/commands/configureAICommand/AiSettingsPanel/handle.md)