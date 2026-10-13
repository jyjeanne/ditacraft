---
type: TypeScript Method
title: inlineMiddle
resource: src/shared/editor/toSource.ts#L354-L409
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/toSource/Writer/origin
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/projectText
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/Writer/raw
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/Writer/characterEdit
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/Writer/shareMark
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/Writer/outerStart
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/Writer/outerEnd
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/Writer/markOnlySources
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/Writer/blockList
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/toSource/Writer/children
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private inlineMiddle(old: PMNode[], neu: PMNode[], i: number, jo: number, jn: number, cStart: number, cEnd: number, indent: string, inlineResult: boolean): string`

# Calls

- [origin](../../../../../../functions/src/shared/editor/toSource/Writer/origin.md)
- [projectText](../../../../../../functions/src/shared/editor/toSource/projectText.md)
- [raw](../../../../../../functions/src/shared/editor/toSource/Writer/raw.md)
- [characterEdit](../../../../../../functions/src/shared/editor/toSource/Writer/characterEdit.md)
- [shareMark](../../../../../../functions/src/shared/editor/toSource/Writer/shareMark.md)
- [outerStart](../../../../../../functions/src/shared/editor/toSource/Writer/outerStart.md)
- [outerEnd](../../../../../../functions/src/shared/editor/toSource/Writer/outerEnd.md)
- [markOnlySources](../../../../../../functions/src/shared/editor/toSource/Writer/markOnlySources.md)
- [blockList](../../../../../../functions/src/shared/editor/toSource/Writer/blockList.md)

# Called by

- [children](../../../../../../functions/src/shared/editor/toSource/Writer/children.md)