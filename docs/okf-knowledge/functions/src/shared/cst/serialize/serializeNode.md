---
type: TypeScript Function
title: serializeNode
resource: src/shared/cst/serialize.ts#L34-L58
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/serialize/escapeText
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/serialize/serializeElement
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/cst/serialize/serializeElement
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/serialize/serialize
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function serializeNode(node: CstNode, source: string): string`

# Calls

- [escapeText](../../../../../functions/src/shared/cst/serialize/escapeText.md)
- [serializeElement](../../../../../functions/src/shared/cst/serialize/serializeElement.md)

# Called by

- [serializeElement](../../../../../functions/src/shared/cst/serialize/serializeElement.md)
- [serialize](../../../../../functions/src/shared/cst/serialize/serialize.md)