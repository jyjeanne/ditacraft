---
type: TypeScript Function
title: sentence
resource: src/llm/providers/connectionCheck.ts#L62-L64
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/llm/providers/connectionCheck/describeApiFailure
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/llm/providers/ollamaProvider/OllamaLLMProvider/checkConnection
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function sentence(text: string): string`

# Called by

- [describeApiFailure](../../../../../functions/src/llm/providers/connectionCheck/describeApiFailure.md)
- [checkConnection](../../../../../functions/src/llm/providers/ollamaProvider/OllamaLLMProvider/checkConnection.md)