---
type: TypeScript Function
title: needsFullRender
resource: src/shared/render/toHtml.ts#L1535-L1557
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/types/isElement
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/resolveReferences
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function needsFullRender(el: ElementNode, options: RenderOptions = {}): boolean`

# Calls

- [isElement](../../../../../functions/src/shared/cst/types/isElement.md)
- [has](../../../../../functions/src/shared/render/toHtml/Renderer/has.md)

# Called by

- [resolveReferences](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/resolveReferences.md)