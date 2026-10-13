---
type: TypeScript Function
title: mapProblems
resource: src/preview/problems.ts#L27-L40
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/elementIndex/ElementIndex/chainAt
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/postProblems
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function mapProblems(diagnostics: readonly DiagnosticLike[], index: ElementIndex): Problem[]`

# Calls

- [chainAt](../../../../functions/src/shared/cst/elementIndex/ElementIndex/chainAt.md)

# Called by

- [postProblems](../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/postProblems.md)