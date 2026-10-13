---
type: TypeScript Method
title: checkConnection
resource: src/llm/providers/ollamaProvider.ts#L50-L79
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/llm/providers/connectionCheck/sentence
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/llm/providers/connectionCheck/connectionReason
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async checkConnection(signal: AbortSignal): Promise<ConnectionCheck>`

# Calls

- [sentence](../../../../../../functions/src/llm/providers/connectionCheck/sentence.md)
- [connectionReason](../../../../../../functions/src/llm/providers/connectionCheck/connectionReason.md)