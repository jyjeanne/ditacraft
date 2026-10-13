---
type: TypeScript Method
title: editLabel
resource: webview/editor/mapView.ts#L407-L451
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/editable
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/reusedView/resolvedItemOf
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/maps/mapRowInfo
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/grammarRegistry/GrammarRegistry/select
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/MapRowView/redraw
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/mapCommands/MapCommands/setLabel
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/mapView/editRowLabel
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`editLabel(): void`

# Calls

- [editable](../../../../../functions/webview/editor/editable.md)
- [resolvedItemOf](../../../../../functions/webview/editor/reusedView/resolvedItemOf.md)
- [mapRowInfo](../../../../../functions/src/shared/editor/maps/mapRowInfo.md)
- [select](../../../../../functions/src/preview/grammarRegistry/GrammarRegistry/select.md)
- [redraw](../../../../../functions/webview/editor/mapView/MapRowView/redraw.md)
- [setLabel](../../../../../functions/src/shared/editor/mapCommands/MapCommands/setLabel.md)

# Called by

- [editRowLabel](../../../../../functions/webview/editor/mapView/editRowLabel.md)