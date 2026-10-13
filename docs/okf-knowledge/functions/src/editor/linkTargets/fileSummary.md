---
type: TypeScript Function
title: fileSummary
resource: src/editor/linkTargets.ts#L97-L109
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/query/rootElement
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/RowDrag/find
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/types/isElement
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/linkTargets/titleOf
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/editor/linkPicker/fileTargets
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function fileSummary(doc: Document, tokensOf: TokensOf): { title: string; map: boolean } | null`

# Calls

- [rootElement](../../../../functions/src/shared/cst/query/rootElement.md)
- [find](../../../../functions/webview/editor/mapView/RowDrag/find.md)
- [isElement](../../../../functions/src/shared/cst/types/isElement.md)
- [titleOf](../../../../functions/src/editor/linkTargets/titleOf.md)

# Called by

- [fileTargets](../../../../functions/src/editor/linkPicker/fileTargets.md)