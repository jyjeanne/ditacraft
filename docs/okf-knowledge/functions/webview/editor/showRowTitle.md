---
type: TypeScript Function
title: showRowTitle
resource: webview/editor/main.ts#L1146-L1159
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/test/shared/editor/test/nodeAt
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/RowDrag/find
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/pickRowTarget
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/addReference
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function showRowTitle(pos: number, title: string | undefined): void`

# Calls

- [nodeAt](../../../functions/src/test/shared/editor/test/nodeAt.md)
- [find](../../../functions/webview/editor/mapView/RowDrag/find.md)

# Called by

- [pickRowTarget](../../../functions/webview/editor/pickRowTarget.md)
- [addReference](../../../functions/webview/editor/addReference.md)