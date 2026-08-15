---
type: TypeScript Method
title: _buildMessages
resource: src/llm/providers/ollamaProvider.ts#L144-L156
visibility: private
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/src/llm/providers/ollamaProvider/OllamaLLMProvider/complete
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/llm/providers/ollamaProvider/OllamaLLMProvider/stream
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private _buildMessages(request: LLMRequest): Array<{ role: string; content: string }>`

# Called by

- [complete](../../../../../../functions/src/llm/providers/ollamaProvider/OllamaLLMProvider/complete.md)
- [stream](../../../../../../functions/src/llm/providers/ollamaProvider/OllamaLLMProvider/stream.md)