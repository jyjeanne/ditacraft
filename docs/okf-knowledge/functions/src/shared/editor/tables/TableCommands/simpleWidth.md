---
type: TypeScript Method
title: simpleWidth
resource: src/shared/editor/tables.ts#L1019-L1031
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/shared/editor/tables/TableCommands/columnWidths
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/tables/TableCommands/simpleAddRow
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/tables/TableCommands/simpleDeleteColumn
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private simpleWidth(rows: PMNode[]): number`

# Called by

- [columnWidths](../../../../../../functions/src/shared/editor/tables/TableCommands/columnWidths.md)
- [simpleAddRow](../../../../../../functions/src/shared/editor/tables/TableCommands/simpleAddRow.md)
- [simpleDeleteColumn](../../../../../../functions/src/shared/editor/tables/TableCommands/simpleDeleteColumn.md)