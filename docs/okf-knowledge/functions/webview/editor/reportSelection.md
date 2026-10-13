---
type: TypeScript Function
title: reportSelection
resource: webview/editor/main.ts#L681-L692
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/selectionChain
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/scheduleSelectionReport
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function reportSelection(): void`

# Calls

- [selectionChain](../../../functions/webview/editor/selectionChain.md)

# Called by

- [scheduleSelectionReport](../../../functions/webview/editor/scheduleSelectionReport.md)