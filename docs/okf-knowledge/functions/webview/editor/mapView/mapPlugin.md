---
type: TypeScript Function
title: mapPlugin
resource: webview/editor/mapView.ts#L173-L309
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/maps/selectedRow
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/visibleRows
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/selectRow
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/maps/mapRowInfo
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/isFolded
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/setFold
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/maps/isMapRow
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/maps/mapRowTarget
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/editable
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/editRowLabel
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/mapCommands/MapCommands/canTarget
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/relTables/RelTableCommands/selectedCell
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/addReference
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/grammarRegistry/GrammarRegistry/entries
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/maps/isMapDocument
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/maps/hiddenMetadataSelection
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/plugins
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function mapPlugin(page: MapPage): Plugin[]`

# Calls

- [selectedRow](../../../../functions/src/shared/editor/maps/selectedRow.md)
- [visibleRows](../../../../functions/webview/editor/mapView/visibleRows.md)
- [selectRow](../../../../functions/webview/editor/mapView/selectRow.md)
- [mapRowInfo](../../../../functions/src/shared/editor/maps/mapRowInfo.md)
- [isFolded](../../../../functions/webview/editor/mapView/isFolded.md)
- [setFold](../../../../functions/webview/editor/mapView/setFold.md)
- [isMapRow](../../../../functions/src/shared/editor/maps/isMapRow.md)
- [mapRowTarget](../../../../functions/src/shared/editor/maps/mapRowTarget.md)
- [editable](../../../../functions/webview/editor/editable.md)
- [editRowLabel](../../../../functions/webview/editor/mapView/editRowLabel.md)
- [canTarget](../../../../functions/src/shared/editor/mapCommands/MapCommands/canTarget.md)
- [selectedCell](../../../../functions/src/shared/editor/relTables/RelTableCommands/selectedCell.md)
- [addReference](../../../../functions/webview/editor/addReference.md)
- [entries](../../../../functions/src/preview/grammarRegistry/GrammarRegistry/entries.md)
- [isMapDocument](../../../../functions/src/shared/editor/maps/isMapDocument.md)
- [hiddenMetadataSelection](../../../../functions/src/shared/editor/maps/hiddenMetadataSelection.md)

# Called by

- [plugins](../../../../functions/webview/editor/plugins.md)