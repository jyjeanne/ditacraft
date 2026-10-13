---
type: TypeScript Function
title: editedSpan
resource: src/shared/editor/sourceChange.ts#L62-L70
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/shared/editor/sourceChange/sourceChangeTransaction
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function editedSpan(text: string, edits: readonly TextEdit[]): TextSpan | undefined`

# Called by

- [sourceChangeTransaction](../../../../../functions/src/shared/editor/sourceChange/sourceChangeTransaction.md)