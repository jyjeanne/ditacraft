---
type: TypeScript Function
title: flagStyle
resource: src/preview/ditaval.ts#L180-L203
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
  - target: functions/src/shared/render/html/decodeXmlText
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/query/rawTextContent
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/preview/ditaval/buildDitavalFilter
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function flagStyle(prop: ElementNode, ditavalPath: string, imageSrc: (absolutePath: string) => string | undefined): FlagStyle`

# Calls

- [childElements](../../../../functions/src/shared/cst/query/childElements.md)
- [find](../../../../functions/webview/editor/mapView/RowDrag/find.md)
- [decodeXmlText](../../../../functions/src/shared/render/html/decodeXmlText.md)
- [rawTextContent](../../../../functions/src/shared/cst/query/rawTextContent.md)

# Called by

- [buildDitavalFilter](../../../../functions/src/preview/ditaval/buildDitavalFilter.md)