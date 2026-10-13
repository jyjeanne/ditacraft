---
type: TypeScript Function
title: isForeignRoot
resource: src/shared/render/foreign.ts#L54-L57
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/foreign/localName
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/render/foreign/findForeignRoot
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function isForeignRoot(el: ElementNode): boolean`

# Calls

- [localName](../../../../../functions/src/shared/render/foreign/localName.md)

# Called by

- [findForeignRoot](../../../../../functions/src/shared/render/foreign/findForeignRoot.md)