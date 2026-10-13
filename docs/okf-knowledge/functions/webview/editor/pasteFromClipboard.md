---
type: TypeScript Function
title: pasteFromClipboard
resource: webview/editor/main.ts#L1601-L1623
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/editable
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/pasteText
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/runMenuItem
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function pasteFromClipboard(): Promise<void>`

# Calls

- [editable](../../../functions/webview/editor/editable.md)
- [pasteText](../../../functions/webview/editor/pasteText.md)

# Called by

- [runMenuItem](../../../functions/webview/editor/runMenuItem.md)