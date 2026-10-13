---
type: TypeScript Function
title: selectionChain
resource: webview/editor/main.ts#L650-L679
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/editable
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/reportSelection
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function selectionChain(state: EditorState): SelectedElement[]`

# Calls

- [editable](../../../functions/webview/editor/editable.md)

# Called by

- [reportSelection](../../../functions/webview/editor/reportSelection.md)