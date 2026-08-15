---
type: TypeScript Method
title: recordFailure
resource: src/llm/circuitBreaker.ts#L41-L62
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/llm/circuitBreaker/CircuitBreaker/_tick
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/llm/llmRouterService/BreakerWrappedProvider/complete
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/llm/llmRouterService/BreakerWrappedProvider/stream
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`recordFailure(): void`

# Calls

- [_tick](../../../../../functions/src/llm/circuitBreaker/CircuitBreaker/_tick.md)

# Called by

- [complete](../../../../../functions/src/llm/llmRouterService/BreakerWrappedProvider/complete.md)
- [stream](../../../../../functions/src/llm/llmRouterService/BreakerWrappedProvider/stream.md)