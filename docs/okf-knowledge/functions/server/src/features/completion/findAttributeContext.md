---
type: TypeScript Function
title: findAttributeContext
resource: server/src/features/completion.ts#L218-L245
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/server/src/features/completion/detectContext
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function findAttributeContext(text: string, beforeWord: number, _offset: number): DetectedContext | null`

# Called by

- [detectContext](../../../../../functions/server/src/features/completion/detectContext.md)