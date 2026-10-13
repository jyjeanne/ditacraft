---
type: TypeScript Method
title: newText
resource: src/shared/editor/toSource.ts#L170-L173
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/toSource/cdataText
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/serialize/escapeText
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/toSource/Writer/node
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private newText(node: PMNode): string`

# Calls

- [cdataText](../../../../../../functions/src/shared/editor/toSource/cdataText.md)
- [escapeText](../../../../../../functions/src/shared/cst/serialize/escapeText.md)

# Called by

- [node](../../../../../../functions/src/shared/editor/toSource/Writer/node.md)