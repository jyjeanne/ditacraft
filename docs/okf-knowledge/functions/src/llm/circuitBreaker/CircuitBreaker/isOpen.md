---
type: TypeScript Method
title: isOpen
resource: src/llm/circuitBreaker.ts#L28-L31
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/llm/circuitBreaker/CircuitBreaker/_tick
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/llm/llmRouterService/BreakerWrappedProvider/isAvailable
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/llm/llmRouterService/BreakerWrappedProvider/complete
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/llm/llmRouterService/BreakerWrappedProvider/stream
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`isOpen(): boolean`

# Calls

- [_tick](../../../../../functions/src/llm/circuitBreaker/CircuitBreaker/_tick.md)

# Called by

- [isAvailable](../../../../../functions/src/llm/llmRouterService/BreakerWrappedProvider/isAvailable.md)
- [complete](../../../../../functions/src/llm/llmRouterService/BreakerWrappedProvider/complete.md)
- [stream](../../../../../functions/src/llm/llmRouterService/BreakerWrappedProvider/stream.md)