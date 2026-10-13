---
type: TypeScript Method
title: checkConnection
resource: src/llm/llmRouterService.ts#L47-L51
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/llm/circuitBreaker/CircuitBreaker/recordSuccess
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async checkConnection(signal: AbortSignal): Promise<ConnectionCheck>`

# Calls

- [recordSuccess](../../../../../functions/src/llm/circuitBreaker/CircuitBreaker/recordSuccess.md)