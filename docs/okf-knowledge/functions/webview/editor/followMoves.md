---
type: TypeScript Function
title: followMoves
resource: webview/editor/main.ts#L220-L246
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/mapView/RowDrag/find
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/shared/editor/test/nodeAt
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/resolvedPlugin
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function followMoves(set: DecorationSet, tr: Transaction, oldDoc: PMNode): DecorationSet`

# Calls

- [find](../../../functions/webview/editor/mapView/RowDrag/find.md)
- [has](../../../functions/src/shared/render/toHtml/Renderer/has.md)
- [nodeAt](../../../functions/src/test/shared/editor/test/nodeAt.md)

# Called by

- [resolvedPlugin](../../../functions/webview/editor/resolvedPlugin.md)