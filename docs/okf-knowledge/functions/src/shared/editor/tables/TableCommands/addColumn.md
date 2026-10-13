---
type: TypeScript Method
title: addColumn
resource: src/shared/editor/tables.ts#L536-L619
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/tables/TableCommands/simpleAt
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/tables/TableCommands/simpleAddColumn
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/tables/freshName
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/tables/TableCommands/withAttr
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/RowDrag/find
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/tables/TableCommands/emptyCell
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/tables/TableCommands/commit
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`addColumn(where: 'before' | 'after'): Command`

# Calls

- [simpleAt](../../../../../../functions/src/shared/editor/tables/TableCommands/simpleAt.md)
- [simpleAddColumn](../../../../../../functions/src/shared/editor/tables/TableCommands/simpleAddColumn.md)
- [freshName](../../../../../../functions/src/shared/editor/tables/freshName.md)
- [withAttr](../../../../../../functions/src/shared/editor/tables/TableCommands/withAttr.md)
- [has](../../../../../../functions/src/shared/render/toHtml/Renderer/has.md)
- [find](../../../../../../functions/webview/editor/mapView/RowDrag/find.md)
- [emptyCell](../../../../../../functions/src/shared/editor/tables/TableCommands/emptyCell.md)
- [commit](../../../../../../functions/src/shared/editor/tables/TableCommands/commit.md)