---
type: TypeScript Function
title: projectText
resource: src/shared/editor/toSource.ts#L49-L66
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
  - target: functions/src/shared/editor/toSource/Writer/inlineMiddle
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function projectText(t: TextOrigin, next: string): { start: number; end: number; text: string }`

# Calls

- [cdataText](../../../../../functions/src/shared/editor/toSource/cdataText.md)
- [escapeText](../../../../../functions/src/shared/cst/serialize/escapeText.md)

# Called by

- [inlineMiddle](../../../../../functions/src/shared/editor/toSource/Writer/inlineMiddle.md)