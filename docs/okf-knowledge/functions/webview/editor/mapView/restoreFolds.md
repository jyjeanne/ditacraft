---
type: TypeScript Function
title: restoreFolds
resource: webview/editor/mapView.ts#L114-L127
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/maps/rowAtPath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/shared/editor/test/nodeAt
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/maps/mapRowInfo
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/foldDecoration
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/rebuild
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function restoreFolds(view: EditorView, paths: readonly string[], es: EditorSchema): void`

# Calls

- [rowAtPath](../../../../functions/src/shared/editor/maps/rowAtPath.md)
- [nodeAt](../../../../functions/src/test/shared/editor/test/nodeAt.md)
- [mapRowInfo](../../../../functions/src/shared/editor/maps/mapRowInfo.md)
- [foldDecoration](../../../../functions/webview/editor/mapView/foldDecoration.md)

# Called by

- [rebuild](../../../../functions/webview/editor/rebuild.md)