---
type: TypeScript Function
title: firstFree
resource: src/shared/editor/tables.ts#L1160-L1167
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/tables/TableCommands/addRow
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function firstFree(covered: Set<number>, cols: number): number`

# Calls

- [has](../../../../../functions/src/shared/render/toHtml/Renderer/has.md)

# Called by

- [addRow](../../../../../functions/src/shared/editor/tables/TableCommands/addRow.md)