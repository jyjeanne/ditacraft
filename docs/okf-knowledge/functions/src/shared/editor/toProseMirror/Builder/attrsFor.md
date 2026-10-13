---
type: TypeScript Method
title: attrsFor
resource: src/shared/editor/toProseMirror.ts#L237-L239
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/elementIndex/ElementIndex/idOf
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toProseMirror/Builder/xmlAttrs
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/toProseMirror/Builder/opaque
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toProseMirror/Builder/block
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toProseMirror/Builder/inlineElement
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private attrsFor(el: ElementNode, view: Record<string, unknown> | null = null): Record<string, unknown>`

# Calls

- [idOf](../../../../../../functions/src/shared/cst/elementIndex/ElementIndex/idOf.md)
- [xmlAttrs](../../../../../../functions/src/shared/editor/toProseMirror/Builder/xmlAttrs.md)

# Called by

- [opaque](../../../../../../functions/src/shared/editor/toProseMirror/Builder/opaque.md)
- [block](../../../../../../functions/src/shared/editor/toProseMirror/Builder/block.md)
- [inlineElement](../../../../../../functions/src/shared/editor/toProseMirror/Builder/inlineElement.md)