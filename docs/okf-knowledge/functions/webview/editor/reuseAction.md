---
type: TypeScript Function
title: reuseAction
resource: webview/editor/main.ts#L1725-L1735
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/editable
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/sendReuse
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/runMenuItem
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/updateReuseBar
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/debug
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function reuseAction(node: PMNode, action: ReuseAction): void`

# Calls

- [editable](../../../functions/webview/editor/editable.md)
- [sendReuse](../../../functions/webview/editor/sendReuse.md)

# Called by

- [runMenuItem](../../../functions/webview/editor/runMenuItem.md)
- [updateReuseBar](../../../functions/webview/editor/updateReuseBar.md)
- [debug](../../../functions/webview/editor/debug.md)