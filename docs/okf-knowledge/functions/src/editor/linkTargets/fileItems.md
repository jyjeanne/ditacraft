---
type: TypeScript Function
title: fileItems
resource: src/editor/linkTargets.ts#L168-L176
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/editor/linkTargets/fileLink
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/editor/linkPicker/pickLinkTarget
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function fileItems(docPath: string, file: FileTarget, targets: DocTarget[], itself: string): PickItem[]`

# Calls

- [fileLink](../../../../functions/src/editor/linkTargets/fileLink.md)

# Called by

- [pickLinkTarget](../../../../functions/src/editor/linkPicker/pickLinkTarget.md)