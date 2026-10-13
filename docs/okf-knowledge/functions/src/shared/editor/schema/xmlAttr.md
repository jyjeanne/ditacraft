---
type: TypeScript Function
title: xmlAttr
resource: src/shared/editor/schema.ts#L460-L463
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/mapView/RowDrag/find
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/schema/baseAttrs
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/schema/elementDom
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/schema/opaqueDom
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function xmlAttr(node: PMNode, name: string): string | undefined`

# Calls

- [find](../../../../../functions/webview/editor/mapView/RowDrag/find.md)

# Called by

- [baseAttrs](../../../../../functions/src/shared/editor/schema/baseAttrs.md)
- [elementDom](../../../../../functions/src/shared/editor/schema/elementDom.md)
- [opaqueDom](../../../../../functions/src/shared/editor/schema/opaqueDom.md)