---
type: TypeScript Function
title: noteReuse
resource: webview/editor/main.ts#L1720-L1723
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/updateReuseBar
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/sendReuse
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/reuseResult
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/replaceWithCopy
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function noteReuse(node: PMNode, text: string): void`

# Calls

- [updateReuseBar](../../../functions/webview/editor/updateReuseBar.md)

# Called by

- [sendReuse](../../../functions/webview/editor/sendReuse.md)
- [reuseResult](../../../functions/webview/editor/reuseResult.md)
- [replaceWithCopy](../../../functions/webview/editor/replaceWithCopy.md)