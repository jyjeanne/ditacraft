---
type: TypeScript Method
title: stream
resource: src/llm/providers/openaiProvider.ts#L90-L117
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/llm/providers/openaiProvider/chatParameters
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async stream( request: LLMRequest, onChunk: (chunk: string) => void, signal: AbortSignal ): Promise<void>`

# Calls

- [chatParameters](../../../../../../functions/src/llm/providers/openaiProvider/chatParameters.md)