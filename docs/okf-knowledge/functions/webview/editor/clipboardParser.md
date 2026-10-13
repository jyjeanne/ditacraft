---
type: TypeScript Function
title: clipboardParser
resource: webview/editor/main.ts#L816-L870
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/toProseMirror/Builder/block
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/start
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function clipboardParser(es: EditorSchema): PMDOMParser`

# Calls

- [block](../../../functions/src/shared/editor/toProseMirror/Builder/block.md)

# Called by

- [start](../../../functions/webview/editor/start.md)