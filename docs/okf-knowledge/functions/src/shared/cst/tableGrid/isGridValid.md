---
type: TypeScript Function
title: isGridValid
resource: src/shared/cst/tableGrid.ts#L115-L146
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/shared/editor/toProseMirror/Builder/prepareTable
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/renderTgroup
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/shared/editorTables/test/check
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function isGridValid(grid: TableGrid): boolean`

# Called by

- [prepareTable](../../../../../functions/src/shared/editor/toProseMirror/Builder/prepareTable.md)
- [renderTgroup](../../../../../functions/src/shared/render/toHtml/renderTgroup.md)
- [check](../../../../../functions/src/test/shared/editorTables/test/check.md)