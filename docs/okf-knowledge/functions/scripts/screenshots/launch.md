---
type: JavaScript Function
title: launch
resource: scripts/screenshots/lib.js#L58-L103
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/mapView/RowDrag/find
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/scripts/screenshots/shoot/main
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function launch({ code, extension, folder, work, settings, port })`

# Calls

- [find](../../../functions/webview/editor/mapView/RowDrag/find.md)

# Called by

- [main](../../../functions/scripts/screenshots/shoot/main.md)