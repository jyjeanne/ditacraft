---
type: TypeScript Function
title: sameXml
resource: src/shared/editor/toSource.ts#L37-L41
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/shared/editor/toSource/rawWithAttributes
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/Writer/changedElement
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function sameXml(a: Pairs | undefined, b: Pairs | undefined): boolean`

# Called by

- [rawWithAttributes](../../../../../functions/src/shared/editor/toSource/rawWithAttributes.md)
- [changedElement](../../../../../functions/src/shared/editor/toSource/Writer/changedElement.md)