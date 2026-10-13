---
type: TypeScript Method
title: withViews
resource: src/shared/editor/tables.ts#L285-L318
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/tables/TableCommands/withWidthsView
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/tables/TableCommands/grid
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/tables/TableCommands/rebuild
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private withViews(group: PMNode, pos: number): PMNode`

# Calls

- [withWidthsView](../../../../../../functions/src/shared/editor/tables/TableCommands/withWidthsView.md)
- [grid](../../../../../../functions/src/shared/editor/tables/TableCommands/grid.md)

# Called by

- [rebuild](../../../../../../functions/src/shared/editor/tables/TableCommands/rebuild.md)