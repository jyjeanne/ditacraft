---
type: TypeScript Method
title: places
resource: src/preview/mapContexts.ts#L161-L163
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/preview/mapContext/findPlaces
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/mapContexts/MapContexts/loadMaps
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/mapContexts/MapContexts/preferredRoot
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/preview/mapContexts/MapContexts/contextOf
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/mapContexts/MapContexts/chooseFromMapRow
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/mapContexts/MapContexts/pick
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async places(topicPath: string): Promise<MapPlace[]>`

# Calls

- [findPlaces](../../../../../functions/src/preview/mapContext/findPlaces.md)
- [loadMaps](../../../../../functions/src/preview/mapContexts/MapContexts/loadMaps.md)
- [preferredRoot](../../../../../functions/src/preview/mapContexts/MapContexts/preferredRoot.md)

# Called by

- [contextOf](../../../../../functions/src/preview/mapContexts/MapContexts/contextOf.md)
- [chooseFromMapRow](../../../../../functions/src/preview/mapContexts/MapContexts/chooseFromMapRow.md)
- [pick](../../../../../functions/src/preview/mapContexts/MapContexts/pick.md)