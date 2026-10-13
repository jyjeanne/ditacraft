---
type: JavaScript Function
title: shot
resource: scripts/screenshots/lib.js#L203-L206
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/scripts/screenshots/Cdp/send
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/scripts/screenshots/shoot/shotContext
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function shot(cdp, file, clip)`

# Calls

- [send](../../../functions/scripts/screenshots/Cdp/send.md)

# Called by

- [shotContext](../../../functions/scripts/screenshots/shoot/shotContext.md)