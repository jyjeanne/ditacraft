---
type: TypeScript Method
title: titleText
resource: src/preview/resolver.ts#L536-L543
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/preview/resolver/ReferenceResolver/titleChild
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/preview/resolver/ReferenceResolver/titleOfFile
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/ReferenceResolver/resolveKeyref
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/ReferenceResolver/resolveHref
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private titleText(el: ElementNode): string`

# Calls

- [titleChild](../../../../../functions/src/preview/resolver/ReferenceResolver/titleChild.md)

# Called by

- [titleOfFile](../../../../../functions/src/preview/resolver/ReferenceResolver/titleOfFile.md)
- [resolveKeyref](../../../../../functions/src/preview/resolver/ReferenceResolver/resolveKeyref.md)
- [resolveHref](../../../../../functions/src/preview/resolver/ReferenceResolver/resolveHref.md)