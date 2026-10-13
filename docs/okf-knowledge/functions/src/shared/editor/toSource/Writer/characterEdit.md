---
type: TypeScript Method
title: characterEdit
resource: src/shared/editor/toSource.ts#L418-L524
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/toSource/Writer/origin
    resolved_by: tree-sitter
    confidence: exact
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

`private characterEdit(oldMid: PMNode[], newMid: PMNode[], before: PMNode | undefined, after: PMNode | undefined, untouched: PMNode[]): { start: number; end: number; text: string } | 'unchanged' | undefined`

# Calls

- [origin](../../../../../../functions/src/shared/editor/toSource/Writer/origin.md)
- [cdataText](../../../../../../functions/src/shared/editor/toSource/cdataText.md)
- [escapeText](../../../../../../functions/src/shared/cst/serialize/escapeText.md)

# Called by

- [inlineMiddle](../../../../../../functions/src/shared/editor/toSource/Writer/inlineMiddle.md)