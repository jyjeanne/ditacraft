---
type: TypeScript Method
title: targetPath
resource: src/preview/resolver.ts#L490-L504
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/preview/resolver/splitOnce
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/decode
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/preview/resolver/ReferenceResolver/resolveForeign
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/ReferenceResolver/resolveCode
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private async targetPath(el: ElementNode, docPath: string): Promise<{ path: string; fragment?: string } | undefined>`

# Calls

- [splitOnce](../../../../../functions/src/preview/resolver/splitOnce.md)
- [decode](../../../../../functions/src/preview/resolver/decode.md)

# Called by

- [resolveForeign](../../../../../functions/src/preview/resolver/ReferenceResolver/resolveForeign.md)
- [resolveCode](../../../../../functions/src/preview/resolver/ReferenceResolver/resolveCode.md)