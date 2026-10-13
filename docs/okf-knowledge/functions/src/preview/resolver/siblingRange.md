---
type: TypeScript Function
title: siblingRange
resource: src/preview/resolver.ts#L630-L641
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/query/childElements
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/preview/resolver/ReferenceResolver/resolveReuse
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function siblingRange(start: ElementNode, end: ElementNode): ElementNode[] | undefined`

# Calls

- [childElements](../../../../functions/src/shared/cst/query/childElements.md)

# Called by

- [resolveReuse](../../../../functions/src/preview/resolver/ReferenceResolver/resolveReuse.md)