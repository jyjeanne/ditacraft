---
type: TypeScript Function
title: isEmpty
resource: src/preview/resolver.ts#L559-L567
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/types/isElement
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/preview/resolver/ReferenceResolver/collect
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function isEmpty(el: ElementNode, tokensOf: (e: ElementNode) => string[]): boolean`

# Calls

- [isElement](../../../../functions/src/shared/cst/types/isElement.md)

# Called by

- [collect](../../../../functions/src/preview/resolver/ReferenceResolver/collect.md)