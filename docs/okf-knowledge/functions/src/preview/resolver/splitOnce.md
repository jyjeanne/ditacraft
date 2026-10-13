---
type: TypeScript Function
title: splitOnce
resource: src/preview/resolver.ts#L573-L576
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/preview/resolver/ReferenceResolver/resolveMapReference
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/ReferenceResolver/resolveReuse
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/ReferenceResolver/resolveKeyref
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/ReferenceResolver/targetPath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/parseReference
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function splitOnce(value: string, sep: string): [string, string]`

# Called by

- [resolveMapReference](../../../../functions/src/preview/resolver/ReferenceResolver/resolveMapReference.md)
- [resolveReuse](../../../../functions/src/preview/resolver/ReferenceResolver/resolveReuse.md)
- [resolveKeyref](../../../../functions/src/preview/resolver/ReferenceResolver/resolveKeyref.md)
- [targetPath](../../../../functions/src/preview/resolver/ReferenceResolver/targetPath.md)
- [parseReference](../../../../functions/src/preview/resolver/parseReference.md)