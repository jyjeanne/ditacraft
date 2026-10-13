---
type: TypeScript Function
title: columnResizing
resource: webview/editor/columnResize.ts#L87-L207
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/editable
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/columnResize/tableNode
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/tables/TableCommands/columnWidths
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/columnResize/measureEdges
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/columnWidths/resizedColumnWidths
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/menu/ContextMenu/place
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/tables/TableCommands/setColumnWidths
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/RowDrag/end
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/plugins
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function columnResizing(ctx: () => ColumnResizeContext | undefined): Plugin`

# Calls

- [editable](../../../../functions/webview/editor/editable.md)
- [tableNode](../../../../functions/webview/editor/columnResize/tableNode.md)
- [columnWidths](../../../../functions/src/shared/editor/tables/TableCommands/columnWidths.md)
- [measureEdges](../../../../functions/webview/editor/columnResize/measureEdges.md)
- [resizedColumnWidths](../../../../functions/src/shared/editor/columnWidths/resizedColumnWidths.md)
- [place](../../../../functions/webview/editor/menu/ContextMenu/place.md)
- [setColumnWidths](../../../../functions/src/shared/editor/tables/TableCommands/setColumnWidths.md)
- [end](../../../../functions/webview/editor/mapView/RowDrag/end.md)

# Called by

- [plugins](../../../../functions/webview/editor/plugins.md)