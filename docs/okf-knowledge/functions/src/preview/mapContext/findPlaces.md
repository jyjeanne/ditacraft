---
type: TypeScript Function
title: findPlaces
resource: src/preview/mapContext.ts#L156-L194
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
  - target: functions/src/preview/mapContext/submapsOf
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/mapContext/referencesTo
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/mapContext/placeInfo
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/mapContext/ancestry
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/preview/mapContexts/MapContexts/places
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function findPlaces(topicPath: string, maps: ReadonlyMap<string, Document>, tokensOf: TokensOf, preferredRoot?: string): MapPlace[]`

# Calls

- [find](../../../../functions/webview/editor/mapView/RowDrag/find.md)
- [same](../../../../functions/src/preview/mapContext/same.md)
- [submapsOf](../../../../functions/src/preview/mapContext/submapsOf.md)
- [has](../../../../functions/src/shared/render/toHtml/Renderer/has.md)
- [referencesTo](../../../../functions/src/preview/mapContext/referencesTo.md)
- [placeInfo](../../../../functions/src/preview/mapContext/placeInfo.md)
- [ancestry](../../../../functions/src/preview/mapContext/ancestry.md)

# Called by

- [places](../../../../functions/src/preview/mapContexts/MapContexts/places.md)