---
type: TypeScript Function
title: noteStatus
resource: webview/editor/main.ts#L1239-L1243
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/updateStatus
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/pickRowTarget
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/addReference
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/listQuickFixes
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/makeQuickFix
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function noteStatus(text: string): void`

# Calls

- [updateStatus](../../../functions/webview/editor/updateStatus.md)

# Called by

- [pickRowTarget](../../../functions/webview/editor/pickRowTarget.md)
- [addReference](../../../functions/webview/editor/addReference.md)
- [listQuickFixes](../../../functions/webview/editor/listQuickFixes.md)
- [makeQuickFix](../../../functions/webview/editor/makeQuickFix.md)