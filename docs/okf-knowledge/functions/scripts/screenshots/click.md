---
type: JavaScript Function
title: click
resource: scripts/screenshots/lib.js#L212-L216
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/scripts/screenshots/mouse
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/scripts/screenshots/shoot/shotContext
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/menu/ContextMenu/onKey
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function click(cdp, x, y, button = 'left')`

# Calls

- [mouse](../../../functions/scripts/screenshots/mouse.md)

# Called by

- [shotContext](../../../functions/scripts/screenshots/shoot/shotContext.md)
- [onKey](../../../functions/webview/editor/menu/ContextMenu/onKey.md)