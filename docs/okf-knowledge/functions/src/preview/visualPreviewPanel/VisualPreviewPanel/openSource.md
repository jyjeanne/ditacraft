---
type: TypeScript Method
title: openSource
resource: src/preview/visualPreviewPanel.ts#L902-L908
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/elementIndex/ElementIndex/openingTagOffset
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/openFileAt
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`public async openSource(id = this.lastSelectedId ?? this.lastTopId): Promise<void>`

# Calls

- [openingTagOffset](../../../../../functions/src/shared/cst/elementIndex/ElementIndex/openingTagOffset.md)
- [openFileAt](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/openFileAt.md)