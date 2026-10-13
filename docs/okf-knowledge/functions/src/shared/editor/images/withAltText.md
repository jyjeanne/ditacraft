---
type: TypeScript Function
title: withAltText
resource: src/shared/editor/images.ts#L341-L365
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/query/rootElement
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/serialize/escapeText
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/RowDrag/find
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/types/isElement
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/images/ImageCommands/setAlt
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function withAltText(raw: string, alt: string, isAlt: (name: string) => boolean): string`

# Calls

- [rootElement](../../../../../functions/src/shared/cst/query/rootElement.md)
- [escapeText](../../../../../functions/src/shared/cst/serialize/escapeText.md)
- [find](../../../../../functions/webview/editor/mapView/RowDrag/find.md)
- [isElement](../../../../../functions/src/shared/cst/types/isElement.md)

# Called by

- [setAlt](../../../../../functions/src/shared/editor/images/ImageCommands/setAlt.md)