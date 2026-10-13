---
type: TypeScript Function
title: selectedReuse
resource: webview/editor/main.ts#L1672-L1675
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/webview/editor/menuContext
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/runMenuItem
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/updateReuseBar
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function selectedReuse(): { node: PMNode; pos: number } | undefined`

# Called by

- [menuContext](../../../functions/webview/editor/menuContext.md)
- [runMenuItem](../../../functions/webview/editor/runMenuItem.md)
- [updateReuseBar](../../../functions/webview/editor/updateReuseBar.md)