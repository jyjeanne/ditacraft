---
type: TypeScript Function
title: ruleKey
resource: src/preview/ditaval.ts#L28-L30
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/preview/ditaval/buildDitavalFilter
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/ditaval/decideValues
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function ruleKey(att: string | undefined, val: string | undefined): string`

# Called by

- [buildDitavalFilter](../../../../functions/src/preview/ditaval/buildDitavalFilter.md)
- [decideValues](../../../../functions/src/preview/ditaval/decideValues.md)