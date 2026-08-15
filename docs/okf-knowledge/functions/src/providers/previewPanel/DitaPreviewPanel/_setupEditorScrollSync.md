---
type: TypeScript Method
title: _setupEditorScrollSync
resource: src/providers/previewPanel.ts#L233-L257
visibility: private
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/providers/previewPanel/DitaPreviewPanel/_handleEditorScroll
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/previewPanel/DitaPreviewPanel/_handleEditorCursorChange
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/providers/previewPanel/DitaPreviewPanel/constructor
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private _setupEditorScrollSync(): void`

# Calls

- [_handleEditorScroll](../../../../../functions/src/providers/previewPanel/DitaPreviewPanel/_handleEditorScroll.md)
- [_handleEditorCursorChange](../../../../../functions/src/providers/previewPanel/DitaPreviewPanel/_handleEditorCursorChange.md)

# Called by

- [constructor](../../../../../functions/src/providers/previewPanel/DitaPreviewPanel/constructor.md)