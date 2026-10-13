---
type: TypeScript Method
title: getProviderStatuses
resource: src/llm/llmRouterService.ts#L205-L212
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/commands/configureAICommand/AiSettingsPanel/post
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async getProviderStatuses(): Promise<Array<{ provider: ILLMProvider; available: boolean }>>`

# Called by

- [post](../../../../../functions/src/commands/configureAICommand/AiSettingsPanel/post.md)