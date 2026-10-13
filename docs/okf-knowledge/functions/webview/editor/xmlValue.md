---
type: TypeScript Function
title: xmlValue
resource: webview/editor/main.ts#L1642-L1644
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/mapView/RowDrag/find
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/updateReuseBar
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function xmlValue(node: PMNode, name: string): string | undefined`

# Calls

- [find](../../../functions/webview/editor/mapView/RowDrag/find.md)

# Called by

- [updateReuseBar](../../../functions/webview/editor/updateReuseBar.md)