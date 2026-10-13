---
type: TypeScript Method
title: selectedCell
resource: src/shared/editor/relTables.ts#L70-L73
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/shared/editor/relTables/RelTableCommands/goToCell
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/mapPlugin
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`selectedCell(state: EditorState): { pos: number; node: PMNode } | undefined`

# Called by

- [goToCell](../../../../../../functions/src/shared/editor/relTables/RelTableCommands/goToCell.md)
- [mapPlugin](../../../../../../functions/webview/editor/mapView/mapPlugin.md)