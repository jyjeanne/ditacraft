---
type: TypeScript Function
title: describeApiFailure
resource: src/llm/providers/connectionCheck.ts#L14-L30
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/llm/providers/connectionCheck/sentence
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/llm/providers/anthropicProvider/AnthropicLLMProvider/checkConnection
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/llm/providers/openaiProvider/OpenAILLMProvider/checkConnection
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function describeApiFailure(failure: ApiFailure, service: string, model: string, timeoutMs: number): string`

# Calls

- [sentence](../../../../../functions/src/llm/providers/connectionCheck/sentence.md)

# Called by

- [checkConnection](../../../../../functions/src/llm/providers/anthropicProvider/AnthropicLLMProvider/checkConnection.md)
- [checkConnection](../../../../../functions/src/llm/providers/openaiProvider/OpenAILLMProvider/checkConnection.md)