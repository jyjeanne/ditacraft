---
type: TypeScript Method
title: titleChild
resource: src/preview/resolver.ts#L228-L230
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
  - target: functions/src/preview/resolver/ReferenceResolver/titleOfFile
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/ReferenceResolver/mapTitle
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/ReferenceResolver/titleText
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private titleChild(el: ElementNode): ElementNode | undefined`

# Calls

- [childElements](../../../../../functions/src/shared/cst/query/childElements.md)
- [find](../../../../../functions/webview/editor/mapView/RowDrag/find.md)

# Called by

- [titleOfFile](../../../../../functions/src/preview/resolver/ReferenceResolver/titleOfFile.md)
- [mapTitle](../../../../../functions/src/preview/resolver/ReferenceResolver/mapTitle.md)
- [titleText](../../../../../functions/src/preview/resolver/ReferenceResolver/titleText.md)