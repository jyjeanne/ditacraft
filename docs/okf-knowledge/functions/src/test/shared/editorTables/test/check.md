---
type: TypeScript Function
title: check
resource: src/test/shared/editorTables.test.ts#L90-L103
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/query/findElements
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/tableGrid/computeGrid
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/tableGrid/isGridValid
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/query/childrenNamed
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/ditaRulesValidator/validateDitaRules
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function check(out: string): { cols: number; rows: string[][]; colspecs: string[] }`

# Calls

- [findElements](../../../../../../functions/src/shared/cst/query/findElements.md)
- [computeGrid](../../../../../../functions/src/shared/cst/tableGrid/computeGrid.md)
- [isGridValid](../../../../../../functions/src/shared/cst/tableGrid/isGridValid.md)
- [childrenNamed](../../../../../../functions/src/shared/cst/query/childrenNamed.md)

# Called by

- [validateDitaRules](../../../../../../functions/server/src/features/ditaRulesValidator/validateDitaRules.md)