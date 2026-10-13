---
type: TypeScript Method
title: checkConnection
resource: src/llm/providers/openaiProvider.ts#L65-L74
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/llm/providers/connectionCheck/describeApiFailure
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/llm/providers/openaiProvider/openaiFailure
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async checkConnection(signal: AbortSignal): Promise<ConnectionCheck>`

# Calls

- [describeApiFailure](../../../../../../functions/src/llm/providers/connectionCheck/describeApiFailure.md)
- [openaiFailure](../../../../../../functions/src/llm/providers/openaiProvider/openaiFailure.md)