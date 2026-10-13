---
type: TypeScript Function
title: updateStatus
resource: webview/editor/main.ts#L1899-L1981
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/shownProblems
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/problemHere
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/editable
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/showQuickFixes
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/labels/format
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/flush
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/noteStatus
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/updateUi
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function updateStatus(): void`

# Calls

- [shownProblems](../../../functions/webview/editor/shownProblems.md)
- [problemHere](../../../functions/webview/editor/problemHere.md)
- [editable](../../../functions/webview/editor/editable.md)
- [showQuickFixes](../../../functions/webview/editor/showQuickFixes.md)
- [format](../../../functions/src/shared/render/labels/format.md)

# Called by

- [flush](../../../functions/webview/editor/flush.md)
- [noteStatus](../../../functions/webview/editor/noteStatus.md)
- [updateUi](../../../functions/webview/editor/updateUi.md)