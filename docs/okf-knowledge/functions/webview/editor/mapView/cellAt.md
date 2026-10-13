---
type: TypeScript Function
title: cellAt
resource: webview/editor/mapView.ts#L752-L766
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/relTables/RelTableCommands/gridAt
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/relTables/RelTableCommands/cellPos
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function cellAt(view: EditorView, page: MapPage, row: number, col: number): number | undefined`

# Calls

- [gridAt](../../../../functions/src/shared/editor/relTables/RelTableCommands/gridAt.md)
- [cellPos](../../../../functions/src/shared/editor/relTables/RelTableCommands/cellPos.md)