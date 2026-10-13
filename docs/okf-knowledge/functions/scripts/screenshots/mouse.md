---
type: JavaScript Function
title: mouse
resource: scripts/screenshots/lib.js#L208-L210
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/scripts/screenshots/Cdp/send
    resolved_by: tree-sitter
    confidence: exact
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

# Calls

- [send](../../../functions/scripts/screenshots/Cdp/send.md)

# Called by

- [click](../../../functions/scripts/screenshots/click.md)
- [shotContext](../../../functions/scripts/screenshots/shoot/shotContext.md)