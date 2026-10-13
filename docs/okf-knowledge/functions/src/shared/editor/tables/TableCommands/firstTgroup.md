---
type: TypeScript Method
title: firstTgroup
resource: src/shared/editor/tables.ts#L856-L864
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/shared/editor/tables/TableCommands/columnWidths
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/tables/TableCommands/setColumnWidths
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private firstTgroup(table: PMNode, tablePos: number): { node: PMNode; pos: number } | undefined`

# Called by

- [columnWidths](../../../../../../functions/src/shared/editor/tables/TableCommands/columnWidths.md)
- [setColumnWidths](../../../../../../functions/src/shared/editor/tables/TableCommands/setColumnWidths.md)