---
type: TypeScript Method
title: resolveOne
resource: src/preview/resolver.ts#L265-L273
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/preview/resolver/ReferenceResolver/resolveReuse
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/ReferenceResolver/resolveForeign
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/ReferenceResolver/resolveCode
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/preview/resolver/ReferenceResolver/resolveIn
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private async resolveOne(request: Request, doc: Document, docPath: string, pass: Pass, depth: number, chain: Set<string>): Promise<Resolution | undefined>`

# Calls

- [resolveReuse](../../../../../functions/src/preview/resolver/ReferenceResolver/resolveReuse.md)
- [resolveForeign](../../../../../functions/src/preview/resolver/ReferenceResolver/resolveForeign.md)
- [resolveCode](../../../../../functions/src/preview/resolver/ReferenceResolver/resolveCode.md)

# Called by

- [resolveIn](../../../../../functions/src/preview/resolver/ReferenceResolver/resolveIn.md)