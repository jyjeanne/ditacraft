---
type: TypeScript Method
title: chainAt
resource: src/shared/cst/elementIndex.ts#L67-L90
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/elementIndex/isInterElementWhitespace
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/elementIndex/ElementIndex/innermostContaining
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/RowDrag/find
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/preview/problems/mapProblems
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/revealInPage
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/properties/propertiesView/PropertiesViewProvider/textTarget
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`chainAt(offset: number): string[]`

# Calls

- [isInterElementWhitespace](../../../../../../functions/src/shared/cst/elementIndex/isInterElementWhitespace.md)
- [innermostContaining](../../../../../../functions/src/shared/cst/elementIndex/ElementIndex/innermostContaining.md)
- [find](../../../../../../functions/webview/editor/mapView/RowDrag/find.md)

# Called by

- [mapProblems](../../../../../../functions/src/preview/problems/mapProblems.md)
- [revealInPage](../../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/revealInPage.md)
- [textTarget](../../../../../../functions/src/properties/propertiesView/PropertiesViewProvider/textTarget.md)