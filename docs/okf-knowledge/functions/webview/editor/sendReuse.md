---
type: TypeScript Function
title: sendReuse
resource: webview/editor/main.ts#L1737-L1746
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/reuseOffset
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/noteReuse
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/reuseAction
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function sendReuse(node: PMNode, action: ReuseAction): void`

# Calls

- [reuseOffset](../../../functions/webview/editor/reuseOffset.md)
- [noteReuse](../../../functions/webview/editor/noteReuse.md)

# Called by

- [reuseAction](../../../functions/webview/editor/reuseAction.md)