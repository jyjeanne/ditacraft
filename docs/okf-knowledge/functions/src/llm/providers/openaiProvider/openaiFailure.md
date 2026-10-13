---
type: TypeScript Function
title: openaiFailure
resource: src/llm/providers/openaiProvider.ts#L124-L131
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/llm/providers/connectionCheck/connectionReason
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/llm/providers/openaiProvider/OpenAILLMProvider/checkConnection
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function openaiFailure(error: unknown): ApiFailure`

# Calls

- [connectionReason](../../../../../functions/src/llm/providers/connectionCheck/connectionReason.md)

# Called by

- [checkConnection](../../../../../functions/src/llm/providers/openaiProvider/OpenAILLMProvider/checkConnection.md)