---
type: TypeScript Function
title: dispatchTransaction
resource: webview/editor/main.ts#L611-L626
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/scheduleSync
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/scheduleSyncReport
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/scheduleUi
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/scheduleSelectionReport
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function dispatchTransaction(tr: Transaction): void`

# Calls

- [scheduleSync](../../../functions/webview/editor/scheduleSync.md)
- [scheduleSyncReport](../../../functions/webview/editor/scheduleSyncReport.md)
- [scheduleUi](../../../functions/webview/editor/scheduleUi.md)
- [scheduleSelectionReport](../../../functions/webview/editor/scheduleSelectionReport.md)