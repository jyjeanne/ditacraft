---
type: TypeScript Method
title: simpleDeleteColumn
resource: src/shared/editor/tables.ts#L1123-L1143
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/tables/TableCommands/simpleWidth
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/tables/TableCommands/relcol
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/tables/TableCommands/simpleCommit
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/tables/TableCommands/replaceRows
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private simpleDeleteColumn(state: EditorState, s: NonNullable<ReturnType<TableCommands['simpleAt']>>, dispatch?: (tr: Transaction) => void): boolean`

# Calls

- [simpleWidth](../../../../../../functions/src/shared/editor/tables/TableCommands/simpleWidth.md)
- [relcol](../../../../../../functions/src/shared/editor/tables/TableCommands/relcol.md)
- [simpleCommit](../../../../../../functions/src/shared/editor/tables/TableCommands/simpleCommit.md)
- [replaceRows](../../../../../../functions/src/shared/editor/tables/TableCommands/replaceRows.md)