---
type: TypeScript Function
title: same
resource: src/preview/mapContext.ts#L102-L105
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/preview/mapContext/referencesTo
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/mapContext/findPlaces
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/mapContext/samePlace
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/mapContexts/MapContexts/chooseFromMapRow
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/reuseOffset
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function same(a: string, b: string): boolean`

# Called by

- [referencesTo](../../../../functions/src/preview/mapContext/referencesTo.md)
- [findPlaces](../../../../functions/src/preview/mapContext/findPlaces.md)
- [samePlace](../../../../functions/src/preview/mapContext/samePlace.md)
- [chooseFromMapRow](../../../../functions/src/preview/mapContexts/MapContexts/chooseFromMapRow.md)
- [reuseOffset](../../../../functions/webview/editor/reuseOffset.md)