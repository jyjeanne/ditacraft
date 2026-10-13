---
type: TypeScript Method
title: markOnlySources
resource: src/shared/editor/toSource.ts#L532-L583
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/toSource/Writer/origin
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/Writer/raw
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/toSource/Writer/inlineMiddle
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private markOnlySources(oldMid: PMNode[], newMid: PMNode[]): Map<PMNode, string> | undefined`

# Calls

- [origin](../../../../../../functions/src/shared/editor/toSource/Writer/origin.md)
- [raw](../../../../../../functions/src/shared/editor/toSource/Writer/raw.md)

# Called by

- [inlineMiddle](../../../../../../functions/src/shared/editor/toSource/Writer/inlineMiddle.md)