---
type: TypeScript Method
title: withAttr
resource: src/shared/editor/tables.ts#L89-L95
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/openTag/withAttribute
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/tables/TableCommands/namedColspecs
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/tables/TableCommands/rebuild
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/tables/TableCommands/addRow
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/tables/TableCommands/addColumn
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/tables/TableCommands/replaceRows
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private withAttr(node: PMNode, name: string, value: string | null): PMNode`

# Calls

- [withAttribute](../../../../../../functions/src/shared/cst/openTag/withAttribute.md)

# Called by

- [namedColspecs](../../../../../../functions/src/shared/editor/tables/TableCommands/namedColspecs.md)
- [rebuild](../../../../../../functions/src/shared/editor/tables/TableCommands/rebuild.md)
- [addRow](../../../../../../functions/src/shared/editor/tables/TableCommands/addRow.md)
- [addColumn](../../../../../../functions/src/shared/editor/tables/TableCommands/addColumn.md)
- [replaceRows](../../../../../../functions/src/shared/editor/tables/TableCommands/replaceRows.md)