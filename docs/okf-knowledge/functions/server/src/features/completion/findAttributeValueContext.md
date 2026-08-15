---
type: TypeScript Function
title: findAttributeValueContext
resource: server/src/features/completion.ts#L173-L213
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/features/completion/findCurrentElement
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/completion/detectContext
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function findAttributeValueContext(text: string, offset: number): DetectedContext | null`

# Calls

- [findCurrentElement](../../../../../functions/server/src/features/completion/findCurrentElement.md)

# Called by

- [detectContext](../../../../../functions/server/src/features/completion/detectContext.md)