---
type: TypeScript Method
title: idOf
resource: src/shared/cst/elementIndex.ts#L49-L51
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/resolveReferences
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/carryResolutions
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toProseMirror/Builder/register
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toProseMirror/Builder/attrsFor
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toProseMirror/Builder/inlineElement
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/structId
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`idOf(el: ElementNode): string | undefined`

# Called by

- [resolveReferences](../../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/resolveReferences.md)
- [carryResolutions](../../../../../../functions/src/preview/visualPreviewPanel/carryResolutions.md)
- [register](../../../../../../functions/src/shared/editor/toProseMirror/Builder/register.md)
- [attrsFor](../../../../../../functions/src/shared/editor/toProseMirror/Builder/attrsFor.md)
- [inlineElement](../../../../../../functions/src/shared/editor/toProseMirror/Builder/inlineElement.md)
- [structId](../../../../../../functions/src/shared/render/toHtml/Renderer/structId.md)