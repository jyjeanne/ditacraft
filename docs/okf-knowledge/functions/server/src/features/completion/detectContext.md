---
type: TypeScript Function
title: detectContext
resource: server/src/features/completion.ts#L97-L132
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/features/completion/findParentElement
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/completion/findAttributeValueContext
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/completion/findAttributeContext
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/completion/handleCompletion
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function detectContext(text: string, offset: number): DetectedContext`

# Calls

- [findParentElement](../../../../../functions/server/src/features/completion/findParentElement.md)
- [findAttributeValueContext](../../../../../functions/server/src/features/completion/findAttributeValueContext.md)
- [findAttributeContext](../../../../../functions/server/src/features/completion/findAttributeContext.md)

# Called by

- [handleCompletion](../../../../../functions/server/src/features/completion/handleCompletion.md)