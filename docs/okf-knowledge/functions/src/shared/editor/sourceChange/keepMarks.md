---
type: TypeScript Function
title: keepMarks
resource: src/shared/editor/sourceChange.ts#L273-L278
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/mapView/RowDrag/find
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/sourceChange/sourceChange
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function keepMarks(node: PMNode, pool: readonly Mark[]): PMNode`

# Calls

- [find](../../../../../functions/webview/editor/mapView/RowDrag/find.md)

# Called by

- [sourceChange](../../../../../functions/src/shared/editor/sourceChange/sourceChange.md)