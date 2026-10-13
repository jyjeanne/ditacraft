---
type: TypeScript Function
title: listQuickFixes
resource: webview/editor/main.ts#L1255-L1271
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/showProblems
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/problemHere
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/noteStatus
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/showQuickFixes
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/debug
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function listQuickFixes(): Promise<{ message: string; reply: Extract<HostToEditor, { type: 'quickFixes' }> } | undefined>`

# Calls

- [showProblems](../../../functions/webview/editor/showProblems.md)
- [problemHere](../../../functions/webview/editor/problemHere.md)
- [noteStatus](../../../functions/webview/editor/noteStatus.md)

# Called by

- [showQuickFixes](../../../functions/webview/editor/showQuickFixes.md)
- [debug](../../../functions/webview/editor/debug.md)