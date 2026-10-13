---
type: TypeScript Function
title: problemHere
resource: webview/editor/main.ts#L464-L467
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/shownProblems
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/RowDrag/find
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/plugins
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/menuContext
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/listQuickFixes
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/updateStatus
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function problemHere(state: EditorState): { from: number; to: number; mark: ProblemMark } | undefined`

# Calls

- [shownProblems](../../../functions/webview/editor/shownProblems.md)
- [find](../../../functions/webview/editor/mapView/RowDrag/find.md)

# Called by

- [plugins](../../../functions/webview/editor/plugins.md)
- [menuContext](../../../functions/webview/editor/menuContext.md)
- [listQuickFixes](../../../functions/webview/editor/listQuickFixes.md)
- [updateStatus](../../../functions/webview/editor/updateStatus.md)