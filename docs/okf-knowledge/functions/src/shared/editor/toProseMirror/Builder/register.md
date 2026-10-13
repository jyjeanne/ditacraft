---
type: TypeScript Method
title: register
resource: src/shared/editor/toProseMirror.ts#L228-L235
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/toProseMirror/Builder/elementOrigin
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/elementIndex/ElementIndex/idOf
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private register(node: PMNode, el: ElementNode, origin: NodeOrigin = this.elementOrigin(el)): PMNode`

# Calls

- [elementOrigin](../../../../../../functions/src/shared/editor/toProseMirror/Builder/elementOrigin.md)
- [idOf](../../../../../../functions/src/shared/cst/elementIndex/ElementIndex/idOf.md)