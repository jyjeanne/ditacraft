---
type: TypeScript Function
title: applyTextEdits
resource: src/shared/editor/sourceChange.ts#L47-L59
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/shared/editor/sourceChange/sourceChangeTransaction
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function applyTextEdits(text: string, edits: readonly TextEdit[]): string | undefined`

# Called by

- [sourceChangeTransaction](../../../../../functions/src/shared/editor/sourceChange/sourceChangeTransaction.md)