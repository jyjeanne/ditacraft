---
type: TypeScript Function
title: connectionReason
resource: src/llm/providers/connectionCheck.ts#L47-L59
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/llm/providers/anthropicProvider/anthropicFailure
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/llm/providers/ollamaProvider/OllamaLLMProvider/checkConnection
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/llm/providers/openaiProvider/openaiFailure
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function connectionReason(error: unknown): string`

# Called by

- [anthropicFailure](../../../../../functions/src/llm/providers/anthropicProvider/anthropicFailure.md)
- [checkConnection](../../../../../functions/src/llm/providers/ollamaProvider/OllamaLLMProvider/checkConnection.md)
- [openaiFailure](../../../../../functions/src/llm/providers/openaiProvider/openaiFailure.md)