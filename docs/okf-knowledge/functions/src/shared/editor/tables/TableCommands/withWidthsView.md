---
type: TypeScript Method
title: withWidthsView
resource: src/shared/editor/tables.ts#L321-L334
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/columnWidths/tgroupWidths
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/tables/TableCommands/withViews
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/tables/TableCommands/setColumnWidths
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private withWidthsView(tgroup: PMNode): PMNode`

# Calls

- [tgroupWidths](../../../../../../functions/src/shared/editor/columnWidths/tgroupWidths.md)

# Called by

- [withViews](../../../../../../functions/src/shared/editor/tables/TableCommands/withViews.md)
- [setColumnWidths](../../../../../../functions/src/shared/editor/tables/TableCommands/setColumnWidths.md)