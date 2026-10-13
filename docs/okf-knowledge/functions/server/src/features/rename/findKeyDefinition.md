---
type: TypeScript Function
title: findKeyDefinition
resource: server/src/features/rename.ts#L251-L269
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/mapView/RowDrag/find
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/rename/resolveUsage
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function findKeyDefinition(text: string, keyName: string, sourceLine: number | undefined): KeyAtOffset | null`

# Calls

- [find](../../../../../functions/webview/editor/mapView/RowDrag/find.md)

# Called by

- [resolveUsage](../../../../../functions/server/src/features/rename/resolveUsage.md)