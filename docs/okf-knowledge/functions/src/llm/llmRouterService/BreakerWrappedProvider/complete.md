---
type: TypeScript Method
title: complete
resource: src/llm/llmRouterService.ts#L53-L67
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
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

`async complete(request: LLMRequest): Promise<LLMResponse>`

# Calls

- [recordSuccess](../../../../../functions/src/llm/circuitBreaker/CircuitBreaker/recordSuccess.md)
- [isAbortError](../../../../../functions/src/llm/llmRouterService/isAbortError.md)
- [recordFailure](../../../../../functions/src/llm/circuitBreaker/CircuitBreaker/recordFailure.md)