---
type: TypeScript Function
title: mapTitle
resource: src/preview/mapContext.ts#L240-L251
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
  - target: functions/src/preview/mapContext/plain
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/html/decodeXmlText
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function mapTitle(root: ElementNode, tokensOf: TokensOf): string | undefined`

# Calls

- [childElements](../../../../functions/src/shared/cst/query/childElements.md)
- [find](../../../../functions/webview/editor/mapView/RowDrag/find.md)
- [plain](../../../../functions/src/preview/mapContext/plain.md)
- [decodeXmlText](../../../../functions/src/shared/render/html/decodeXmlText.md)