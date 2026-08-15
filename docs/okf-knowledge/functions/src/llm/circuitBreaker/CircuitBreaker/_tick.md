---
type: TypeScript Method
title: _tick
resource: src/llm/circuitBreaker.ts#L65-L81
visibility: private
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/src/llm/circuitBreaker/CircuitBreaker/state
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/llm/circuitBreaker/CircuitBreaker/isOpen
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/llm/circuitBreaker/CircuitBreaker/recordFailure
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private _tick(): void`

# Called by

- [state](../../../../../functions/src/llm/circuitBreaker/CircuitBreaker/state.md)
- [isOpen](../../../../../functions/src/llm/circuitBreaker/CircuitBreaker/isOpen.md)
- [recordFailure](../../../../../functions/src/llm/circuitBreaker/CircuitBreaker/recordFailure.md)