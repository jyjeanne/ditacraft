---
type: TypeScript Method
title: addRow
resource: src/shared/editor/tables.ts#L378-L422
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/tables/TableCommands/simpleAt
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/tables/TableCommands/simpleAddRow
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/tables/TableCommands/emptyCell
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/tables/TableCommands/withRowCells
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/tables/TableCommands/withAttr
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/tables/TableCommands/commit
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/tables/firstFree
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`addRow(where: 'before' | 'after'): Command`

# Calls

- [simpleAt](../../../../../../functions/src/shared/editor/tables/TableCommands/simpleAt.md)
- [simpleAddRow](../../../../../../functions/src/shared/editor/tables/TableCommands/simpleAddRow.md)
- [has](../../../../../../functions/src/shared/render/toHtml/Renderer/has.md)
- [emptyCell](../../../../../../functions/src/shared/editor/tables/TableCommands/emptyCell.md)
- [withRowCells](../../../../../../functions/src/shared/editor/tables/TableCommands/withRowCells.md)
- [withAttr](../../../../../../functions/src/shared/editor/tables/TableCommands/withAttr.md)
- [commit](../../../../../../functions/src/shared/editor/tables/TableCommands/commit.md)
- [firstFree](../../../../../../functions/src/shared/editor/tables/firstFree.md)