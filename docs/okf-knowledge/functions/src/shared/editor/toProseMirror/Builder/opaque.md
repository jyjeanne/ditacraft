---
type: TypeScript Method
title: opaque
resource: src/shared/editor/toProseMirror.ts#L268-L276
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/toProseMirror/Builder/attrsFor
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toProseMirror/Builder/opaqueView
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/toProseMirror/Builder/block
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toProseMirror/Builder/inlineElement
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private opaque(el: ElementNode, context: 'block' | 'inline'): PMNode`

# Calls

- [attrsFor](../../../../../../functions/src/shared/editor/toProseMirror/Builder/attrsFor.md)
- [opaqueView](../../../../../../functions/src/shared/editor/toProseMirror/Builder/opaqueView.md)

# Called by

- [block](../../../../../../functions/src/shared/editor/toProseMirror/Builder/block.md)
- [inlineElement](../../../../../../functions/src/shared/editor/toProseMirror/Builder/inlineElement.md)