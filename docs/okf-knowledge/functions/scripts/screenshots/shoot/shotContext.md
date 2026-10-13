---
type: JavaScript Function
title: shotContext
resource: scripts/screenshots/shoot.js#L107-L214
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/scripts/screenshots/host
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/scripts/screenshots/key
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/scripts/screenshots/page
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/scripts/screenshots/Cdp/send
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/scripts/screenshots/webview
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/scripts/screenshots/click
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/scripts/screenshots/mouse
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/scripts/screenshots/shot
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/scripts/screenshots/shoot/main
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function shotContext(cdp, ctl, demo, outDirs)`

# Calls

- [host](../../../../functions/scripts/screenshots/host.md)
- [key](../../../../functions/scripts/screenshots/key.md)
- [page](../../../../functions/scripts/screenshots/page.md)
- [send](../../../../functions/scripts/screenshots/Cdp/send.md)
- [webview](../../../../functions/scripts/screenshots/webview.md)
- [click](../../../../functions/scripts/screenshots/click.md)
- [mouse](../../../../functions/scripts/screenshots/mouse.md)
- [shot](../../../../functions/scripts/screenshots/shot.md)

# Called by

- [main](../../../../functions/scripts/screenshots/shoot/main.md)