---
type: TypeScript Method
title: storeApiKey
resource: src/llm/secretManager.ts#L16-L18
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/src/commands/configureAICommand/configureAICommand
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async storeApiKey(provider: string, key: string): Promise<void>`

# Called by

- [configureAICommand](../../../../../functions/src/commands/configureAICommand/configureAICommand.md)