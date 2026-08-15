---
type: TypeScript Method
title: stream
resource: src/llm/llmRouterService.ts#L61-L80
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/llm/circuitBreaker/CircuitBreaker/isOpen
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/llm/circuitBreaker/CircuitBreaker/recordSuccess
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/llm/llmRouterService/isAbortError
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/llm/circuitBreaker/CircuitBreaker/recordFailure
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async stream( request: LLMRequest, onChunk: (chunk: string) => void, signal: AbortSignal ): Promise<void>`

# Calls

- [isOpen](../../../../../functions/src/llm/circuitBreaker/CircuitBreaker/isOpen.md)
- [recordSuccess](../../../../../functions/src/llm/circuitBreaker/CircuitBreaker/recordSuccess.md)
- [isAbortError](../../../../../functions/src/llm/llmRouterService/isAbortError.md)
- [recordFailure](../../../../../functions/src/llm/circuitBreaker/CircuitBreaker/recordFailure.md)