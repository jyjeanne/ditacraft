---
type: TypeScript Function
title: tgroupWidths
resource: src/shared/editor/columnWidths.ts#L104-L107
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/columnWidths/cssColumnWidths
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/tables/TableCommands/withWidthsView
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toProseMirror/Builder/viewFor
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function tgroupWidths(cols: number, colwidths: (string | undefined)[]): string[] | undefined`

# Calls

- [cssColumnWidths](../../../../../functions/src/shared/editor/columnWidths/cssColumnWidths.md)

# Called by

- [withWidthsView](../../../../../functions/src/shared/editor/tables/TableCommands/withWidthsView.md)
- [viewFor](../../../../../functions/src/shared/editor/toProseMirror/Builder/viewFor.md)