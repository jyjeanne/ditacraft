---
type: TypeScript Method
title: setColumnWidths
resource: src/shared/editor/tables.ts#L898-L948
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/tables/TableCommands/columnWidths
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/shared/editor/test/nodeAt
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/openTag/withAttribute
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/tables/TableCommands/firstTgroup
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/tables/TableCommands/grid
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/images/ImageCommands/insert
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/tables/TableCommands/withWidthsView
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/test/shared/editorColumnWidths/test/set
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/columnResize/columnResizing
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`setColumnWidths(tablePos: number, widths: (string | undefined)[]): Command`

# Calls

- [columnWidths](../../../../../../functions/src/shared/editor/tables/TableCommands/columnWidths.md)
- [nodeAt](../../../../../../functions/src/test/shared/editor/test/nodeAt.md)
- [withAttribute](../../../../../../functions/src/shared/cst/openTag/withAttribute.md)
- [firstTgroup](../../../../../../functions/src/shared/editor/tables/TableCommands/firstTgroup.md)
- [grid](../../../../../../functions/src/shared/editor/tables/TableCommands/grid.md)
- [insert](../../../../../../functions/src/shared/editor/images/ImageCommands/insert.md)
- [withWidthsView](../../../../../../functions/src/shared/editor/tables/TableCommands/withWidthsView.md)

# Called by

- [set](../../../../../../functions/src/test/shared/editorColumnWidths/test/set.md)
- [columnResizing](../../../../../../functions/webview/editor/columnResize/columnResizing.md)