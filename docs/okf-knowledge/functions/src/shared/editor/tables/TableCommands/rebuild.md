---
type: TypeScript Method
title: rebuild
resource: src/shared/editor/tables.ts#L233-L282
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/mapView/RowDrag/find
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/tables/TableCommands/withAttr
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/tables/TableCommands/withViews
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private rebuild(grid: Grid, colspecs: PMNode[], rows: Record<'thead' | 'tbody', PMNode[]>, cols: number): PMNode`

# Calls

- [find](../../../../../../functions/webview/editor/mapView/RowDrag/find.md)
- [withAttr](../../../../../../functions/src/shared/editor/tables/TableCommands/withAttr.md)
- [withViews](../../../../../../functions/src/shared/editor/tables/TableCommands/withViews.md)