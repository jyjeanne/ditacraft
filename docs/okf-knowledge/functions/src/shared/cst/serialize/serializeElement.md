---
type: TypeScript Function
title: serializeElement
resource: src/shared/cst/serialize.ts#L60-L83
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/serialize/serializeNode
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/cst/serialize/serializeNode
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function serializeElement(el: ElementNode, source: string): string`

# Calls

- [serializeNode](../../../../../functions/src/shared/cst/serialize/serializeNode.md)

# Called by

- [serializeNode](../../../../../functions/src/shared/cst/serialize/serializeNode.md)