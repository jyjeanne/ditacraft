---
type: TypeScript Method
title: simpleDeleteRow
resource: src/shared/editor/tables.ts#L1051-L1061
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/tables/TableCommands/simpleCommit
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/tables/TableCommands/replaceRows
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private simpleDeleteRow(state: EditorState, s: NonNullable<ReturnType<TableCommands['simpleAt']>>, dispatch?: (tr: Transaction) => void): boolean`

# Calls

- [simpleCommit](../../../../../../functions/src/shared/editor/tables/TableCommands/simpleCommit.md)
- [replaceRows](../../../../../../functions/src/shared/editor/tables/TableCommands/replaceRows.md)