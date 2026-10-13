---
type: TypeScript Method
title: relcol
resource: src/shared/editor/tables.ts#L1082-L1089
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/shared/editor/tables/TableCommands/simpleAddColumn
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/tables/TableCommands/simpleDeleteColumn
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private relcol(table: PMNode, change: (widths: string[]) => string[]): string | null | undefined`

# Called by

- [simpleAddColumn](../../../../../../functions/src/shared/editor/tables/TableCommands/simpleAddColumn.md)
- [simpleDeleteColumn](../../../../../../functions/src/shared/editor/tables/TableCommands/simpleDeleteColumn.md)