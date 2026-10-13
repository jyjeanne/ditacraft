---
type: TypeScript Method
title: simpleCommit
resource: src/shared/editor/tables.ts#L981-L1000
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/shared/editor/tables/TableCommands/simpleAddRow
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/tables/TableCommands/simpleDeleteRow
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/tables/TableCommands/simpleToggleHeader
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/tables/TableCommands/simpleAddColumn
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/tables/TableCommands/simpleDeleteColumn
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private simpleCommit(state: EditorState, s: { table: PMNode; pos: number }, table: PMNode, row: number, col: number, dispatch: (tr: Transaction) => void): void`

# Called by

- [simpleAddRow](../../../../../../functions/src/shared/editor/tables/TableCommands/simpleAddRow.md)
- [simpleDeleteRow](../../../../../../functions/src/shared/editor/tables/TableCommands/simpleDeleteRow.md)
- [simpleToggleHeader](../../../../../../functions/src/shared/editor/tables/TableCommands/simpleToggleHeader.md)
- [simpleAddColumn](../../../../../../functions/src/shared/editor/tables/TableCommands/simpleAddColumn.md)
- [simpleDeleteColumn](../../../../../../functions/src/shared/editor/tables/TableCommands/simpleDeleteColumn.md)