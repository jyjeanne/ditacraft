---
type: TypeScript Function
title: titleOf
resource: src/editor/linkTargets.ts#L62-L66
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
  - target: functions/src/editor/linkTargets/targetsInDocument
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/linkTargets/fileSummary
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function titleOf(el: ElementNode, tokensOf: TokensOf): string`

# Calls

- [childElements](../../../../functions/src/shared/cst/query/childElements.md)
- [find](../../../../functions/webview/editor/mapView/RowDrag/find.md)

# Called by

- [targetsInDocument](../../../../functions/src/editor/linkTargets/targetsInDocument.md)
- [fileSummary](../../../../functions/src/editor/linkTargets/fileSummary.md)