---
type: TypeScript Function
title: anthropicFailure
resource: src/llm/providers/anthropicProvider.ts#L102-L109
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/llm/providers/connectionCheck/connectionReason
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/llm/providers/anthropicProvider/AnthropicLLMProvider/checkConnection
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function anthropicFailure(error: unknown): ApiFailure`

# Calls

- [connectionReason](../../../../../functions/src/llm/providers/connectionCheck/connectionReason.md)

# Called by

- [checkConnection](../../../../../functions/src/llm/providers/anthropicProvider/AnthropicLLMProvider/checkConnection.md)