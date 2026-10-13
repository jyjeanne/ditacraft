---
type: TypeScript Function
title: isReuseNode
resource: src/shared/editor/reused.ts#L41-L51
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
  called_by:
  - target: functions/src/shared/editor/reused/resolvedTargets
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/mapNodeViews
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/reusedView/ReusedView/update
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/reusedView/resolvedNodeViews
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function isReuseNode(node: PMNode): boolean`

# Calls

- [find](../../../../../functions/webview/editor/mapView/RowDrag/find.md)
- [has](../../../../../functions/src/shared/render/toHtml/Renderer/has.md)

# Called by

- [resolvedTargets](../../../../../functions/src/shared/editor/reused/resolvedTargets.md)
- [mapNodeViews](../../../../../functions/webview/editor/mapView/mapNodeViews.md)
- [update](../../../../../functions/webview/editor/reusedView/ReusedView/update.md)
- [resolvedNodeViews](../../../../../functions/webview/editor/reusedView/resolvedNodeViews.md)