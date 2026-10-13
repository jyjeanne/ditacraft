---
type: TypeScript Function
title: carryResolutions
resource: src/preview/visualPreviewPanel.ts#L1088-L1109
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/elementIndex/ElementIndex/idOf
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/referenceSignature
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/ReferenceResolver/collect
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/renderNow
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function carryResolutions(previous: Rendered, next: Rendered, resolver: ReferenceResolver): Map<ElementNode, Resolution>`

# Calls

- [idOf](../../../../functions/src/shared/cst/elementIndex/ElementIndex/idOf.md)
- [referenceSignature](../../../../functions/src/preview/visualPreviewPanel/referenceSignature.md)
- [collect](../../../../functions/src/preview/resolver/ReferenceResolver/collect.md)

# Called by

- [renderNow](../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/renderNow.md)