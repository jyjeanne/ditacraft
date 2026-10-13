---
type: TypeScript Method
title: setLabel
resource: src/shared/editor/mapCommands.ts#L277-L344
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/test/shared/editor/test/nodeAt
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/maps/isMapRow
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/mapCommands/MapCommands/valid
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/RowDrag/find
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/openTag/withAttribute
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/mapCommands/MapCommands/newNavtitle
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/mapCommands/MapCommands/declares
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/images/ImageCommands/insert
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/mapCommands/MapCommands/pointsToTopic
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/mapView/MapRowView/editLabel
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`setLabel(pos: number, label: string): Command`

# Calls

- [nodeAt](../../../../../../functions/src/test/shared/editor/test/nodeAt.md)
- [isMapRow](../../../../../../functions/src/shared/editor/maps/isMapRow.md)
- [valid](../../../../../../functions/src/shared/editor/mapCommands/MapCommands/valid.md)
- [find](../../../../../../functions/webview/editor/mapView/RowDrag/find.md)
- [withAttribute](../../../../../../functions/src/shared/cst/openTag/withAttribute.md)
- [newNavtitle](../../../../../../functions/src/shared/editor/mapCommands/MapCommands/newNavtitle.md)
- [declares](../../../../../../functions/src/shared/editor/mapCommands/MapCommands/declares.md)
- [insert](../../../../../../functions/src/shared/editor/images/ImageCommands/insert.md)
- [pointsToTopic](../../../../../../functions/src/shared/editor/mapCommands/MapCommands/pointsToTopic.md)

# Called by

- [editLabel](../../../../../../functions/webview/editor/mapView/MapRowView/editLabel.md)