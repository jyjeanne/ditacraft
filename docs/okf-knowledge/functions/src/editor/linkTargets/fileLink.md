---
type: TypeScript Function
title: fileLink
resource: src/editor/linkTargets.ts#L121-L124
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/editor/imageFiles/hrefFor
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/editor/linkTargets/pickItems
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/linkTargets/fileItems
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function fileLink(fromDoc: string, file: FileTarget, t?: DocTarget): LinkTarget`

# Calls

- [hrefFor](../../../../functions/src/editor/imageFiles/hrefFor.md)

# Called by

- [pickItems](../../../../functions/src/editor/linkTargets/pickItems.md)
- [fileItems](../../../../functions/src/editor/linkTargets/fileItems.md)