---
type: TypeScript Method
title: separator
resource: src/shared/editor/toSource.ts#L586-L604
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/toSource/Writer/raw
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/Writer/outerEnd
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/Writer/outerStart
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/toSource/Writer/children
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/Writer/blockMiddle
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private separator(old: PMNode[], cStart: number, cEnd: number, indent: string): string`

# Calls

- [raw](../../../../../../functions/src/shared/editor/toSource/Writer/raw.md)
- [outerEnd](../../../../../../functions/src/shared/editor/toSource/Writer/outerEnd.md)
- [outerStart](../../../../../../functions/src/shared/editor/toSource/Writer/outerStart.md)

# Called by

- [children](../../../../../../functions/src/shared/editor/toSource/Writer/children.md)
- [blockMiddle](../../../../../../functions/src/shared/editor/toSource/Writer/blockMiddle.md)