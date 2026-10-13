---
type: TypeScript Function
title: selectElement
resource: webview/preview/main.ts#L272-L280
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/preview/renderStatus
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/preview/renderStatus
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/preview/nextProblem
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function selectElement(el: HTMLElement, notifyHost: boolean): void`

# Calls

- [renderStatus](../../../functions/webview/preview/renderStatus.md)

# Called by

- [renderStatus](../../../functions/webview/preview/renderStatus.md)
- [nextProblem](../../../functions/webview/preview/nextProblem.md)