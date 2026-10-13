---
type: TypeScript Function
title: setAttributes
resource: webview/editor/main.ts#L694-L706
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/editable
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/shared/editor/test/nodeAt
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/scheduleSelectionReport
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function setAttributes(message: Extract<HostToEditor, { type: 'setAttributes' }>): void`

# Calls

- [editable](../../../functions/webview/editor/editable.md)
- [nodeAt](../../../functions/src/test/shared/editor/test/nodeAt.md)
- [scheduleSelectionReport](../../../functions/webview/editor/scheduleSelectionReport.md)