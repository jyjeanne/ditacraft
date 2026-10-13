---
type: TypeScript Function
title: pasteImages
resource: webview/editor/main.ts#L1471-L1482
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/editable
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/parse/Scanner/startsWith
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/start
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function pasteImages(event: ClipboardEvent): boolean`

# Calls

- [editable](../../../functions/webview/editor/editable.md)
- [startsWith](../../../functions/src/shared/cst/parse/Scanner/startsWith.md)

# Called by

- [start](../../../functions/webview/editor/start.md)