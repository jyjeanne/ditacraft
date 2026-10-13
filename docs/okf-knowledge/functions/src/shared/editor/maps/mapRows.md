---
type: TypeScript Function
title: mapRows
resource: src/shared/editor/maps.ts#L278-L294
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/maps/isMapRow
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/test/shared/editorMaps/test/rowsOf
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/shared/editorMaps/test/rowWith
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/setAllFolds
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/visibleRows
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function mapRows(doc: PMNode, es: EditorSchema, folded: (pos: number) => boolean = () => false): { pos: number; node: PMNode; hidden: boolean }[]`

# Calls

- [isMapRow](../../../../../functions/src/shared/editor/maps/isMapRow.md)

# Called by

- [rowsOf](../../../../../functions/src/test/shared/editorMaps/test/rowsOf.md)
- [rowWith](../../../../../functions/src/test/shared/editorMaps/test/rowWith.md)
- [setAllFolds](../../../../../functions/webview/editor/mapView/setAllFolds.md)
- [visibleRows](../../../../../functions/webview/editor/mapView/visibleRows.md)