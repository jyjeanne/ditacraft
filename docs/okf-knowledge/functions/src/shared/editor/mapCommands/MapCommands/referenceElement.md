---
type: TypeScript Method
title: referenceElement
resource: src/shared/editor/mapCommands.ts#L213-L228
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/mapCommands/MapCommands/referencePoint
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/maps/selectedRow
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/mapCommands/MapCommands/declares
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/mapCommands/MapCommands/accepts
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/RowDrag/find
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/mapCommands/MapCommands/insertReference
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`referenceElement(state: EditorState): string | undefined`

# Calls

- [referencePoint](../../../../../../functions/src/shared/editor/mapCommands/MapCommands/referencePoint.md)
- [selectedRow](../../../../../../functions/src/shared/editor/maps/selectedRow.md)
- [declares](../../../../../../functions/src/shared/editor/mapCommands/MapCommands/declares.md)
- [accepts](../../../../../../functions/src/shared/editor/mapCommands/MapCommands/accepts.md)
- [find](../../../../../../functions/webview/editor/mapView/RowDrag/find.md)

# Called by

- [insertReference](../../../../../../functions/src/shared/editor/mapCommands/MapCommands/insertReference.md)