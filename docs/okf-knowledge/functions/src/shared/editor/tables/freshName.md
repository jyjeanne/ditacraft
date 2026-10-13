---
type: TypeScript Function
title: freshName
resource: src/shared/editor/tables.ts#L1147-L1158
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/mapView/RowDrag/find
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/tables/TableCommands/namedColspecs
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/tables/TableCommands/addColumn
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function freshName(used: Set<string>, num: number, existing: (string | undefined)[] = []): string`

# Calls

- [find](../../../../../functions/webview/editor/mapView/RowDrag/find.md)
- [has](../../../../../functions/src/shared/render/toHtml/Renderer/has.md)

# Called by

- [namedColspecs](../../../../../functions/src/shared/editor/tables/TableCommands/namedColspecs.md)
- [addColumn](../../../../../functions/src/shared/editor/tables/TableCommands/addColumn.md)