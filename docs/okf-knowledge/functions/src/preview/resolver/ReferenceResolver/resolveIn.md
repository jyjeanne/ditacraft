---
type: TypeScript Method
title: resolveIn
resource: src/preview/resolver.ts#L241-L263
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/preview/resolver/ReferenceResolver/collect
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/ReferenceResolver/resolveOne
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/preview/resolver/ReferenceResolver/resolve
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/ReferenceResolver/resolveReuse
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private async resolveIn(scope: Document | ElementNode, doc: Document, docPath: string, pass: Pass, depth: number, chain: Set<string>): Promise<void>`

# Calls

- [collect](../../../../../functions/src/preview/resolver/ReferenceResolver/collect.md)
- [resolveOne](../../../../../functions/src/preview/resolver/ReferenceResolver/resolveOne.md)

# Called by

- [resolve](../../../../../functions/src/preview/resolver/ReferenceResolver/resolve.md)
- [resolveReuse](../../../../../functions/src/preview/resolver/ReferenceResolver/resolveReuse.md)