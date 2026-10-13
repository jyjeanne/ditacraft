---
type: TypeScript Function
title: clipboardSerializer
resource: webview/editor/main.ts#L772-L796
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/preview/grammarRegistry/GrammarRegistry/entries
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/rawOf
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/decorate
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/start
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function clipboardSerializer(schema: Schema): DOMSerializer`

# Calls

- [entries](../../../functions/src/preview/grammarRegistry/GrammarRegistry/entries.md)
- [rawOf](../../../functions/webview/editor/rawOf.md)
- [decorate](../../../functions/webview/editor/decorate.md)

# Called by

- [start](../../../functions/webview/editor/start.md)