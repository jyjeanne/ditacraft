---
type: TypeScript Function
title: scheduleSelectionReport
resource: webview/editor/main.ts#L636-L647
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/reportSelection
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/start
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/rebuild
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/dispatchTransaction
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/setAttributes
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function scheduleSelectionReport(force = false): void`

# Calls

- [reportSelection](../../../functions/webview/editor/reportSelection.md)

# Called by

- [start](../../../functions/webview/editor/start.md)
- [rebuild](../../../functions/webview/editor/rebuild.md)
- [dispatchTransaction](../../../functions/webview/editor/dispatchTransaction.md)
- [setAttributes](../../../functions/webview/editor/setAttributes.md)