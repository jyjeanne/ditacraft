---
type: TypeScript Method
title: contentLanguage
resource: src/preview/visualPreviewPanel.ts#L375-L378
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/query/rootElement
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/renderOptions
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/debugState
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private contentLanguage(r: Rendered): string`

# Calls

- [rootElement](../../../../../functions/src/shared/cst/query/rootElement.md)

# Called by

- [renderOptions](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/renderOptions.md)
- [debugState](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/debugState.md)