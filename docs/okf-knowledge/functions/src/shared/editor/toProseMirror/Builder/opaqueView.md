---
type: TypeScript Method
title: opaqueView
resource: src/shared/editor/toProseMirror.ts#L247-L266
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/html/decodeXmlText
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toProseMirror/summary
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/query/rawTextContent
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/RowDrag/find
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/types/isElement
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/toProseMirror/Builder/opaque
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private opaqueView(el: ElementNode, facts: ElementFacts | undefined): Record<string, unknown>`

# Calls

- [decodeXmlText](../../../../../../functions/src/shared/render/html/decodeXmlText.md)
- [summary](../../../../../../functions/src/shared/editor/toProseMirror/summary.md)
- [rawTextContent](../../../../../../functions/src/shared/cst/query/rawTextContent.md)
- [find](../../../../../../functions/webview/editor/mapView/RowDrag/find.md)
- [isElement](../../../../../../functions/src/shared/cst/types/isElement.md)

# Called by

- [opaque](../../../../../../functions/src/shared/editor/toProseMirror/Builder/opaque.md)