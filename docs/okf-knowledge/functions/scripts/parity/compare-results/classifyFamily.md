---
type: JavaScript Function
title: classifyFamily
resource: scripts/parity/compare-results.js#L48-L72
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/parse/Scanner/startsWith
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/scripts/parity/compare-results/toLspIssues
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/scripts/parity/compare-results/toDitaOtIssues
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function classifyFamily(code)`

# Calls

- [startsWith](../../../../functions/src/shared/cst/parse/Scanner/startsWith.md)

# Called by

- [toLspIssues](../../../../functions/scripts/parity/compare-results/toLspIssues.md)
- [toDitaOtIssues](../../../../functions/scripts/parity/compare-results/toDitaOtIssues.md)