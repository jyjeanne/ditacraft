---
type: TypeScript Function
title: isInsideComment
resource: server/src/features/documentLinks.ts#L115-L121
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/server/src/features/documentLinks/processFileRefs
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/documentLinks/processKeyRefs
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function isInsideComment(offset: number, commentRanges: [number, number][]): boolean`

# Called by

- [processFileRefs](../../../../../functions/server/src/features/documentLinks/processFileRefs.md)
- [processKeyRefs](../../../../../functions/server/src/features/documentLinks/processKeyRefs.md)