---
type: TypeScript Function
title: sameReading
resource: src/shared/editor/sourceChange.ts#L337-L343
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/sourceChange/readingOf
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/sourceChange/sourceChangeTransaction
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function sameReading(x: string, y: string): boolean`

# Calls

- [readingOf](../../../../../functions/src/shared/editor/sourceChange/readingOf.md)

# Called by

- [sourceChangeTransaction](../../../../../functions/src/shared/editor/sourceChange/sourceChangeTransaction.md)