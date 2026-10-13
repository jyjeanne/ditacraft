---
type: TypeScript Function
title: reuseOffset
resource: webview/editor/main.ts#L1752-L1767
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/freshBuild
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/reuseNodes
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/mapContext/same
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/sendReuse
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function reuseOffset(node: PMNode): number | undefined`

# Calls

- [freshBuild](../../../functions/webview/editor/freshBuild.md)
- [reuseNodes](../../../functions/webview/editor/reuseNodes.md)
- [same](../../../functions/src/preview/mapContext/same.md)

# Called by

- [sendReuse](../../../functions/webview/editor/sendReuse.md)