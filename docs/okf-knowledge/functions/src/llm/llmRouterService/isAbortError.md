---
type: TypeScript Function
title: isAbortError
resource: src/llm/llmRouterService.ts#L84-L89
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/src/llm/llmRouterService/BreakerWrappedProvider/complete
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/llm/llmRouterService/BreakerWrappedProvider/stream
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function isAbortError(err: unknown): boolean`

# Called by

- [complete](../../../../functions/src/llm/llmRouterService/BreakerWrappedProvider/complete.md)
- [stream](../../../../functions/src/llm/llmRouterService/BreakerWrappedProvider/stream.md)