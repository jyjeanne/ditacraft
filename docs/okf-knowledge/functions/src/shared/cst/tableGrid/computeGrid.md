---
type: TypeScript Function
title: computeGrid
resource: src/shared/cst/tableGrid.ts#L43-L104
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/query/childrenNamed
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/query/firstChildNamed
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
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

`function computeGrid(tgroup: ElementNode): TableGrid`

# Calls

- [childrenNamed](../../../../../functions/src/shared/cst/query/childrenNamed.md)
- [firstChildNamed](../../../../../functions/src/shared/cst/query/firstChildNamed.md)
- [has](../../../../../functions/src/shared/render/toHtml/Renderer/has.md)

# Called by

- [prepareTable](../../../../../functions/src/shared/editor/toProseMirror/Builder/prepareTable.md)
- [renderTgroup](../../../../../functions/src/shared/render/toHtml/renderTgroup.md)
- [check](../../../../../functions/src/test/shared/editorTables/test/check.md)