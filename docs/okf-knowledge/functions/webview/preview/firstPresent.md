---
type: TypeScript Function
title: firstPresent
resource: webview/preview/main.ts#L51-L59
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/preview/byId
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/preview/applyProblems
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/preview/nextProblem
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function firstPresent(ids: string[]): HTMLElement | null`

# Calls

- [byId](../../../functions/webview/preview/byId.md)

# Called by

- [applyProblems](../../../functions/webview/preview/applyProblems.md)
- [nextProblem](../../../functions/webview/preview/nextProblem.md)