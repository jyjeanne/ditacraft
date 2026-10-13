---
type: TypeScript Function
title: firstChildNamed
resource: src/shared/cst/query.ts#L29-L31
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/query/childElements
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/RowDrag/find
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/cst/tableGrid/computeGrid
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function firstChildNamed(el: ElementNode, name: string): ElementNode | undefined`

# Calls

- [childElements](../../../../../functions/src/shared/cst/query/childElements.md)
- [find](../../../../../functions/webview/editor/mapView/RowDrag/find.md)

# Called by

- [computeGrid](../../../../../functions/src/shared/cst/tableGrid/computeGrid.md)