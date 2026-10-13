---
type: TypeScript Method
title: orderedMarks
resource: src/shared/editor/toSource.ts#L722-L728
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/toSource/Writer/markDepth
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/toSource/Writer/inline
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private orderedMarks(marks: readonly Mark[]): Mark[]`

# Calls

- [markDepth](../../../../../../functions/src/shared/editor/toSource/Writer/markDepth.md)

# Called by

- [inline](../../../../../../functions/src/shared/editor/toSource/Writer/inline.md)