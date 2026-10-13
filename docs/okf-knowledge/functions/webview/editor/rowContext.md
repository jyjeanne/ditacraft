---
type: TypeScript Function
title: rowContext
resource: webview/editor/main.ts#L1121-L1124
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/maps/selectedRow
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/maps/mapRowTarget
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/menuContext
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function rowContext(): MenuContext['row']`

# Calls

- [selectedRow](../../../functions/src/shared/editor/maps/selectedRow.md)
- [mapRowTarget](../../../functions/src/shared/editor/maps/mapRowTarget.md)

# Called by

- [menuContext](../../../functions/webview/editor/menuContext.md)