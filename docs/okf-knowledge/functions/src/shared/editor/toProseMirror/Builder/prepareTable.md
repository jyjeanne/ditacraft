---
type: TypeScript Method
title: prepareTable
resource: src/shared/editor/toProseMirror.ts#L562-L577
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/tableGrid/computeGrid
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/tableGrid/isGridValid
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/toProseMirror/Builder/block
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private prepareTable(el: ElementNode, facts: ElementFacts): void`

# Calls

- [computeGrid](../../../../../../functions/src/shared/cst/tableGrid/computeGrid.md)
- [isGridValid](../../../../../../functions/src/shared/cst/tableGrid/isGridValid.md)

# Called by

- [block](../../../../../../functions/src/shared/editor/toProseMirror/Builder/block.md)