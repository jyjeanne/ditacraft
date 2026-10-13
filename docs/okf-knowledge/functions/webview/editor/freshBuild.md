---
type: TypeScript Function
title: freshBuild
resource: webview/editor/main.ts#L180-L194
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/build
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/showResolved
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/showProblems
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/reportSync
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/reveal
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/openRowTarget
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/makeQuickFix
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/reuseOffset
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function freshBuild(): { doc: PMNode; base: Base } | undefined`

# Calls

- [build](../../../functions/webview/editor/build.md)

# Called by

- [showResolved](../../../functions/webview/editor/showResolved.md)
- [showProblems](../../../functions/webview/editor/showProblems.md)
- [reportSync](../../../functions/webview/editor/reportSync.md)
- [reveal](../../../functions/webview/editor/reveal.md)
- [openRowTarget](../../../functions/webview/editor/openRowTarget.md)
- [makeQuickFix](../../../functions/webview/editor/makeQuickFix.md)
- [reuseOffset](../../../functions/webview/editor/reuseOffset.md)