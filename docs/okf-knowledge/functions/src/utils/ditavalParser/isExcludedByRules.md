---
type: TypeScript Function
title: isExcludedByRules
resource: src/utils/ditavalParser.ts#L146-L172
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/src/providers/ditavalDecorationProvider/recompute
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function isExcludedByRules(attrs: Record<string, string | undefined>, rules: readonly DitavalRule[]): boolean`

# Called by

- [recompute](../../../../functions/src/providers/ditavalDecorationProvider/recompute.md)