---
type: TypeScript Method
title: getProviderStatuses
resource: src/llm/llmRouterService.ts#L153-L160
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/src/commands/configureAICommand/configureAICommand
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async getProviderStatuses(): Promise<Array<{ provider: ILLMProvider; available: boolean }>>`

# Called by

- [configureAICommand](../../../../../functions/src/commands/configureAICommand/configureAICommand.md)