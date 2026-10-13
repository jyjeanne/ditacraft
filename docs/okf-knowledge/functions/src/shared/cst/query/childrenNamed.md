---
type: TypeScript Function
title: childrenNamed
resource: src/shared/cst/query.ts#L25-L27
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/query/childElements
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/cst/tableGrid/computeGrid
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/shared/editorTables/test/check
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function childrenNamed(el: ElementNode, name: string): ElementNode[]`

# Calls

- [childElements](../../../../../functions/src/shared/cst/query/childElements.md)

# Called by

- [computeGrid](../../../../../functions/src/shared/cst/tableGrid/computeGrid.md)
- [check](../../../../../functions/src/test/shared/editorTables/test/check.md)