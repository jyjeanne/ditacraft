---
type: TypeScript Function
title: renderElement
resource: src/shared/render/toHtml.ts#L1521-L1524
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/editor/reusedContent/resolvedItems
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/resolveReferences
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function renderElement(doc: Document, el: ElementNode, options: RenderOptions = {}): string`

# Called by

- [resolvedItems](../../../../../functions/src/editor/reusedContent/resolvedItems.md)
- [resolveReferences](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/resolveReferences.md)