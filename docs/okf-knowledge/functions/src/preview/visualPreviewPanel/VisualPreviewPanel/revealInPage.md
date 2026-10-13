---
type: TypeScript Method
title: revealInPage
resource: src/preview/visualPreviewPanel.ts#L912-L923
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/elementIndex/ElementIndex/chainAt
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/registerListeners
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private revealInPage(offset: number, mode: RevealMode, highlight: boolean): void`

# Calls

- [chainAt](../../../../../functions/src/shared/cst/elementIndex/ElementIndex/chainAt.md)

# Called by

- [registerListeners](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/registerListeners.md)