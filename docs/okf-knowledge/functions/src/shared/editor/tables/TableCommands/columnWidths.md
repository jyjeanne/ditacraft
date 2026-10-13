---
type: TypeScript Method
title: columnWidths
resource: src/shared/editor/tables.ts#L871-L895
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/test/shared/editor/test/nodeAt
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/tables/TableCommands/simpleWidth
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/tables/TableCommands/firstTgroup
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/tables/TableCommands/grid
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/tables/TableCommands/setColumnWidths
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/columnResize/columnResizing
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`columnWidths(state: EditorState, tablePos: number): (string | undefined)[] | undefined`

# Calls

- [nodeAt](../../../../../../functions/src/test/shared/editor/test/nodeAt.md)
- [simpleWidth](../../../../../../functions/src/shared/editor/tables/TableCommands/simpleWidth.md)
- [firstTgroup](../../../../../../functions/src/shared/editor/tables/TableCommands/firstTgroup.md)
- [grid](../../../../../../functions/src/shared/editor/tables/TableCommands/grid.md)

# Called by

- [setColumnWidths](../../../../../../functions/src/shared/editor/tables/TableCommands/setColumnWidths.md)
- [columnResizing](../../../../../../functions/webview/editor/columnResize/columnResizing.md)