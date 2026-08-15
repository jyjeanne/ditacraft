---
type: TypeScript Method
title: _handleEditorScroll
resource: src/providers/previewPanel.ts#L262-L332
visibility: private
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/logger/Logger/debug
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/providers/previewPanel/DitaPreviewPanel/_setupEditorScrollSync
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private _handleEditorScroll(editor: vscode.TextEditor): void`

# Calls

- [debug](../../../../../functions/src/utils/logger/Logger/debug.md)

# Called by

- [_setupEditorScrollSync](../../../../../functions/src/providers/previewPanel/DitaPreviewPanel/_setupEditorScrollSync.md)