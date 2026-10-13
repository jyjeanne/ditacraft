---
type: TypeScript Method
title: titleOfFile
resource: src/preview/resolver.ts#L193-L212
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/toHtml/basename
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/query/rootElement
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/findTarget
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/ReferenceResolver/titleChild
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/query/childElements
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/RowDrag/find
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/ReferenceResolver/titleText
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/preview/resolver/ReferenceResolver/resolveMapReference
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private async titleOfFile(filePath: string, topicId: string | undefined, elemId: string | undefined, map: boolean, deps: Set<string>): Promise<Resolution>`

# Calls

- [basename](../../../../../functions/src/shared/render/toHtml/basename.md)
- [rootElement](../../../../../functions/src/shared/cst/query/rootElement.md)
- [findTarget](../../../../../functions/src/preview/resolver/findTarget.md)
- [titleChild](../../../../../functions/src/preview/resolver/ReferenceResolver/titleChild.md)
- [childElements](../../../../../functions/src/shared/cst/query/childElements.md)
- [find](../../../../../functions/webview/editor/mapView/RowDrag/find.md)
- [titleText](../../../../../functions/src/preview/resolver/ReferenceResolver/titleText.md)

# Called by

- [resolveMapReference](../../../../../functions/src/preview/resolver/ReferenceResolver/resolveMapReference.md)