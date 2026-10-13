---
type: TypeScript Method
title: innermostContaining
resource: src/shared/cst/elementIndex.ts#L92-L106
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/mapView/RowDrag/find
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/types/isElement
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/cst/elementIndex/ElementIndex/chainAt
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private innermostContaining(offset: number): ElementNode | undefined`

# Calls

- [find](../../../../../../functions/webview/editor/mapView/RowDrag/find.md)
- [isElement](../../../../../../functions/src/shared/cst/types/isElement.md)

# Called by

- [chainAt](../../../../../../functions/src/shared/cst/elementIndex/ElementIndex/chainAt.md)