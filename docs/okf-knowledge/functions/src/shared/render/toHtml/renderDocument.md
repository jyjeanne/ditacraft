---
type: TypeScript Function
title: renderDocument
resource: src/shared/render/toHtml.ts#L1506-L1513
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/html/escapeHtml
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
  - target: functions/src/test/shared/render/test/render
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function renderDocument(doc: Document, options: RenderOptions = {}): RenderResult`

# Calls

- [escapeHtml](../../../../../functions/src/shared/render/html/escapeHtml.md)

# Called by

- [renderNow](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/renderNow.md)
- [resolveReferences](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/resolveReferences.md)
- [onMessage](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/onMessage.md)
- [render](../../../../../functions/src/test/shared/render/test/render.md)