---
type: TypeScript Function
title: scheduleUi
resource: webview/editor/main.ts#L1837-L1846
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/updateUi
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/dispatchTransaction
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function scheduleUi(): void`

# Calls

- [updateUi](../../../functions/webview/editor/updateUi.md)

# Called by

- [dispatchTransaction](../../../functions/webview/editor/dispatchTransaction.md)