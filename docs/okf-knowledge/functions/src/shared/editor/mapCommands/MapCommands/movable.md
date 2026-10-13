---
type: TypeScript Method
title: movable
resource: src/shared/editor/mapCommands.ts#L106-L138
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
  - target: functions/webview/editor/start
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/mapCommands/MapCommands/accepts
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/mapCommands/MapCommands/valid
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/mapCommands/MapCommands/moveRow
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/mapCommands/MapCommands/dropPosition
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`movable(doc: PMNode, from: number, to: number): boolean`

# Calls

- [nodeAt](../../../../../../functions/src/test/shared/editor/test/nodeAt.md)
- [isMapRow](../../../../../../functions/src/shared/editor/maps/isMapRow.md)
- [start](../../../../../../functions/webview/editor/start.md)
- [accepts](../../../../../../functions/src/shared/editor/mapCommands/MapCommands/accepts.md)
- [valid](../../../../../../functions/src/shared/editor/mapCommands/MapCommands/valid.md)

# Called by

- [moveRow](../../../../../../functions/src/shared/editor/mapCommands/MapCommands/moveRow.md)
- [dropPosition](../../../../../../functions/src/shared/editor/mapCommands/MapCommands/dropPosition.md)