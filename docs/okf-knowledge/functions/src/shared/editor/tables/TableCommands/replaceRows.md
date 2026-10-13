---
type: TypeScript Method
title: replaceRows
resource: src/shared/editor/tables.ts#L1002-L1017
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/tables/TableCommands/withAttr
    resolved_by: tree-sitter
    confidence: exact
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

`private replaceRows(table: PMNode, rows: PMNode[], relcol?: string | null): PMNode`

# Calls

- [withAttr](../../../../../../functions/src/shared/editor/tables/TableCommands/withAttr.md)

# Called by

- [simpleAddRow](../../../../../../functions/src/shared/editor/tables/TableCommands/simpleAddRow.md)
- [simpleDeleteRow](../../../../../../functions/src/shared/editor/tables/TableCommands/simpleDeleteRow.md)
- [simpleToggleHeader](../../../../../../functions/src/shared/editor/tables/TableCommands/simpleToggleHeader.md)
- [simpleAddColumn](../../../../../../functions/src/shared/editor/tables/TableCommands/simpleAddColumn.md)
- [simpleDeleteColumn](../../../../../../functions/src/shared/editor/tables/TableCommands/simpleDeleteColumn.md)