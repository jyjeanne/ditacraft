---
type: TypeScript Function
title: showProblems
resource: webview/editor/main.ts#L296-L321
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/freshBuild
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/problems/problemMarks
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/start
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/rebuild
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/listQuickFixes
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function showProblems(): void`

# Calls

- [freshBuild](../../../functions/webview/editor/freshBuild.md)
- [problemMarks](../../../functions/src/shared/editor/problems/problemMarks.md)

# Called by

- [start](../../../functions/webview/editor/start.md)
- [rebuild](../../../functions/webview/editor/rebuild.md)
- [listQuickFixes](../../../functions/webview/editor/listQuickFixes.md)