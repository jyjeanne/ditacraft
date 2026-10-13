---
type: TypeScript Method
title: outerStart
resource: src/shared/editor/toSource.ts#L306-L309
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/toSource/Writer/origin
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/toSource/Writer/inlineMiddle
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/Writer/separator
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/Writer/blockMiddle
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private outerStart(node: PMNode): number`

# Calls

- [origin](../../../../../../functions/src/shared/editor/toSource/Writer/origin.md)

# Called by

- [inlineMiddle](../../../../../../functions/src/shared/editor/toSource/Writer/inlineMiddle.md)
- [separator](../../../../../../functions/src/shared/editor/toSource/Writer/separator.md)
- [blockMiddle](../../../../../../functions/src/shared/editor/toSource/Writer/blockMiddle.md)