---
type: TypeScript Function
title: foldPaths
resource: webview/editor/mapView.ts#L110-L112
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/mapView/RowDrag/find
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/maps/rowPath
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/rebuild
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function foldPaths(state: EditorState): string[]`

# Calls

- [find](../../../../functions/webview/editor/mapView/RowDrag/find.md)
- [rowPath](../../../../functions/src/shared/editor/maps/rowPath.md)

# Called by

- [rebuild](../../../../functions/webview/editor/rebuild.md)