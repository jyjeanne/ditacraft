---
type: JavaScript Function
title: mouse
resource: scripts/screenshots/lib.js#L208-L210
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/scripts/screenshots/click
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/scripts/screenshots/shoot/shotContext
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function mouse(cdp, type, x, y, button = 'left', clickCount = 1)`

# Called by

- [click](../../../functions/scripts/screenshots/click.md)
- [shotContext](../../../functions/scripts/screenshots/shoot/shotContext.md)