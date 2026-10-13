---
type: TypeScript Function
title: findForeignRoot
resource: src/shared/render/foreign.ts#L110-L123
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/foreign/isForeignRoot
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/types/isElement
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function findForeignRoot(el: ElementNode): ElementNode | undefined`

# Calls

- [isForeignRoot](../../../../../functions/src/shared/render/foreign/isForeignRoot.md)
- [isElement](../../../../../functions/src/shared/cst/types/isElement.md)