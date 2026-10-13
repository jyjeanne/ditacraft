---
type: TypeScript Function
title: reuseElements
resource: src/test/shared/editorReuse.test.ts#L84-L87
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/preview/resolver/ReferenceResolver/collect
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/test/shared/editorReuse/test/copyOf
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function reuseElements(r: ReferenceResolver, source: string): { doc: ReturnType<typeof parse>; els: ElementNode[] }`

# Calls

- [collect](../../../../../../functions/src/preview/resolver/ReferenceResolver/collect.md)

# Called by

- [copyOf](../../../../../../functions/src/test/shared/editorReuse/test/copyOf.md)