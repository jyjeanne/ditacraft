---
type: TypeScript Method
title: grid
resource: src/shared/editor/tables.ts#L106-L166
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/tables/TableCommands/cellAt
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/tables/TableCommands/withViews
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/tables/TableCommands/commit
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/tables/TableCommands/columnWidths
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/tables/TableCommands/setColumnWidths
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private grid(tgroup: PMNode, pos: number): Grid`

# Calls

- [has](../../../../../../functions/src/shared/render/toHtml/Renderer/has.md)

# Called by

- [cellAt](../../../../../../functions/src/shared/editor/tables/TableCommands/cellAt.md)
- [withViews](../../../../../../functions/src/shared/editor/tables/TableCommands/withViews.md)
- [commit](../../../../../../functions/src/shared/editor/tables/TableCommands/commit.md)
- [columnWidths](../../../../../../functions/src/shared/editor/tables/TableCommands/columnWidths.md)
- [setColumnWidths](../../../../../../functions/src/shared/editor/tables/TableCommands/setColumnWidths.md)