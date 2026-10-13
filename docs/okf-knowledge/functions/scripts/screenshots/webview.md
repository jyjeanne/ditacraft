---
type: JavaScript Function
title: webview
resource: scripts/screenshots/lib.js#L159-L200
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/scripts/screenshots/page
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/scripts/screenshots/shoot/shotContext
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function webview(cdp, marker)`

# Calls

- [page](../../../functions/scripts/screenshots/page.md)

# Called by

- [shotContext](../../../functions/scripts/screenshots/shoot/shotContext.md)