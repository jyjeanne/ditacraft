---
type: TypeScript Function
title: plugins
resource: webview/editor/main.ts#L101-L155
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/links/LinkCommands/setLink
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/pickAndSetLink
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/problemHere
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/showQuickFixes
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/mapPlugin
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/problemsPlugin
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/resolvedPlugin
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/columnResize/columnResizing
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/imageResize/imageResizing
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/start
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/rebuild
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function plugins(es: EditorSchema, cmds: DitaCommands, tables: TableCommands, page: MapPage): Plugin[]`

# Calls

- [setLink](../../../functions/src/shared/editor/links/LinkCommands/setLink.md)
- [pickAndSetLink](../../../functions/webview/editor/pickAndSetLink.md)
- [problemHere](../../../functions/webview/editor/problemHere.md)
- [showQuickFixes](../../../functions/webview/editor/showQuickFixes.md)
- [mapPlugin](../../../functions/webview/editor/mapView/mapPlugin.md)
- [problemsPlugin](../../../functions/webview/editor/problemsPlugin.md)
- [resolvedPlugin](../../../functions/webview/editor/resolvedPlugin.md)
- [columnResizing](../../../functions/webview/editor/columnResize/columnResizing.md)
- [imageResizing](../../../functions/webview/editor/imageResize/imageResizing.md)

# Called by

- [start](../../../functions/webview/editor/start.md)
- [rebuild](../../../functions/webview/editor/rebuild.md)