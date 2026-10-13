---
type: TypeScript Method
title: inlineElement
resource: src/shared/editor/toProseMirror.ts#L506-L541
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/toProseMirror/Builder/withMarks
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toProseMirror/Builder/opaque
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/types/isElement
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toProseMirror/Builder/needsBlock
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toProseMirror/Builder/isReference
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/elementIndex/ElementIndex/idOf
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toProseMirror/Builder/attrsFor
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toProseMirror/Builder/elementOrigin
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/toProseMirror/Builder/inline
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private inlineElement(el: ElementNode, state: InlineState, out: PMNode[]): void`

# Calls

- [withMarks](../../../../../../functions/src/shared/editor/toProseMirror/Builder/withMarks.md)
- [opaque](../../../../../../functions/src/shared/editor/toProseMirror/Builder/opaque.md)
- [isElement](../../../../../../functions/src/shared/cst/types/isElement.md)
- [needsBlock](../../../../../../functions/src/shared/editor/toProseMirror/Builder/needsBlock.md)
- [isReference](../../../../../../functions/src/shared/editor/toProseMirror/Builder/isReference.md)
- [has](../../../../../../functions/src/shared/render/toHtml/Renderer/has.md)
- [idOf](../../../../../../functions/src/shared/cst/elementIndex/ElementIndex/idOf.md)
- [attrsFor](../../../../../../functions/src/shared/editor/toProseMirror/Builder/attrsFor.md)
- [elementOrigin](../../../../../../functions/src/shared/editor/toProseMirror/Builder/elementOrigin.md)

# Called by

- [inline](../../../../../../functions/src/shared/editor/toProseMirror/Builder/inline.md)