---
type: TypeScript Function
title: samePlace
resource: src/preview/mapContext.ts#L268-L271
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/mapView/RowDrag/find
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/mapContext/same
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/preview/mapContexts/MapContexts/contextOf
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function samePlace(places: readonly MapPlace[], place: { root: string; maps: readonly string[]; occurrence: number }): MapPlace | undefined`

# Calls

- [find](../../../../functions/webview/editor/mapView/RowDrag/find.md)
- [same](../../../../functions/src/preview/mapContext/same.md)

# Called by

- [contextOf](../../../../functions/src/preview/mapContexts/MapContexts/contextOf.md)