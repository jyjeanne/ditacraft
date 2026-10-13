---
type: TypeScript Function
title: pasteText
resource: webview/editor/main.ts#L1625-L1635
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/editable
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/pasteFromClipboard
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function pasteText(message: Extract<HostToEditor, { type: 'clipboardText' }>): void`

# Calls

- [editable](../../../functions/webview/editor/editable.md)

# Called by

- [pasteFromClipboard](../../../functions/webview/editor/pasteFromClipboard.md)