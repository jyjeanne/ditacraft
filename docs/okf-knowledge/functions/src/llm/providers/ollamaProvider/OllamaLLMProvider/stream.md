---
type: TypeScript Method
title: stream
resource: src/llm/providers/ollamaProvider.ts#L74-L138
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/llm/providers/ollamaProvider/OllamaLLMProvider/_buildMessages
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async stream( request: LLMRequest, onChunk: (chunk: string) => void, signal: AbortSignal ): Promise<void>`

# Calls

- [_buildMessages](../../../../../../functions/src/llm/providers/ollamaProvider/OllamaLLMProvider/_buildMessages.md)