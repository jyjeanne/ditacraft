---
type: TypeScript Function
title: shownProblems
resource: webview/editor/main.ts#L324-L329
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/mapView/RowDrag/find
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/problemHere
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/nextProblem
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/updateStatus
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function shownProblems(state: EditorState): { from: number; to: number; mark: ProblemMark }[]`

# Calls

- [find](../../../functions/webview/editor/mapView/RowDrag/find.md)

# Called by

- [problemHere](../../../functions/webview/editor/problemHere.md)
- [nextProblem](../../../functions/webview/editor/nextProblem.md)
- [updateStatus](../../../functions/webview/editor/updateStatus.md)