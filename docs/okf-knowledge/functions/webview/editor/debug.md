---
type: TypeScript Function
title: debug
resource: webview/editor/main.ts#L2104-L2256
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/editable
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/reuseNodes
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/reuseAction
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/menuContext
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/contextMenu/findItem
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/contextMenu/contextMenu
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/runMenuItem
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/rowByLabel
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/setFold
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/parse/Scanner/startsWith
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/dropRow
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/insertImageData
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/listQuickFixes
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/RowDrag/find
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/makeQuickFix
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function debug(message: Extract<HostToEditor, { type: 'debug' }>): void`

# Calls

- [editable](../../../functions/webview/editor/editable.md)
- [reuseNodes](../../../functions/webview/editor/reuseNodes.md)
- [reuseAction](../../../functions/webview/editor/reuseAction.md)
- [menuContext](../../../functions/webview/editor/menuContext.md)
- [findItem](../../../functions/src/shared/editor/contextMenu/findItem.md)
- [contextMenu](../../../functions/src/shared/editor/contextMenu/contextMenu.md)
- [runMenuItem](../../../functions/webview/editor/runMenuItem.md)
- [rowByLabel](../../../functions/webview/editor/mapView/rowByLabel.md)
- [setFold](../../../functions/webview/editor/mapView/setFold.md)
- [startsWith](../../../functions/src/shared/cst/parse/Scanner/startsWith.md)
- [dropRow](../../../functions/webview/editor/mapView/dropRow.md)
- [insertImageData](../../../functions/webview/editor/insertImageData.md)
- [listQuickFixes](../../../functions/webview/editor/listQuickFixes.md)
- [find](../../../functions/webview/editor/mapView/RowDrag/find.md)
- [makeQuickFix](../../../functions/webview/editor/makeQuickFix.md)