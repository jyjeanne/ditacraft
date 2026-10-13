---
type: TypeScript Method
title: meta
resource: src/preview/visualPreviewPanel.ts#L653-L666
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/toHtml/basename
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/contextMeta
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/renderNow
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/resolveReferences
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/onMessage
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private meta(r: Rendered): DocMeta`

# Calls

- [basename](../../../../../functions/src/shared/render/toHtml/basename.md)
- [contextMeta](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/contextMeta.md)

# Called by

- [renderNow](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/renderNow.md)
- [resolveReferences](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/resolveReferences.md)
- [onMessage](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/onMessage.md)