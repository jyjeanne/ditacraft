---
type: TypeScript Function
title: rowAtPath
resource: src/shared/editor/maps.ts#L307-L328
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/maps/isMapRow
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/mapView/restoreFolds
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function rowAtPath(doc: PMNode, path: string, es: EditorSchema): number | undefined`

# Calls

- [isMapRow](../../../../../functions/src/shared/editor/maps/isMapRow.md)

# Called by

- [restoreFolds](../../../../../functions/webview/editor/mapView/restoreFolds.md)