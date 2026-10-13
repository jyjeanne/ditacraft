---
type: TypeScript Function
title: hiddenMetadataSelection
resource: src/shared/editor/maps.ts#L257-L275
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/maps/isMapDocument
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/maps/isMapRow
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/fixMapSelection
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/mapPlugin
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function hiddenMetadataSelection(state: EditorState, es: EditorSchema): Selection | undefined`

# Calls

- [isMapDocument](../../../../../functions/src/shared/editor/maps/isMapDocument.md)
- [isMapRow](../../../../../functions/src/shared/editor/maps/isMapRow.md)

# Called by

- [fixMapSelection](../../../../../functions/webview/editor/fixMapSelection.md)
- [mapPlugin](../../../../../functions/webview/editor/mapView/mapPlugin.md)