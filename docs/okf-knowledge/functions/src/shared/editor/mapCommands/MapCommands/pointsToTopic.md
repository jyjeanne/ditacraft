---
type: TypeScript Method
title: pointsToTopic
resource: src/shared/editor/mapCommands.ts#L366-L370
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/mapView/RowDrag/find
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/mapCommands/MapCommands/setLabel
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private pointsToTopic(xml: AttributePairs): boolean`

# Calls

- [find](../../../../../../functions/webview/editor/mapView/RowDrag/find.md)

# Called by

- [setLabel](../../../../../../functions/src/shared/editor/mapCommands/MapCommands/setLabel.md)