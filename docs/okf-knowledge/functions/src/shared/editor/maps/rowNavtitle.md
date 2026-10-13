---
type: TypeScript Function
title: rowNavtitle
resource: src/shared/editor/maps.ts#L106-L111
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/maps/childWith
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/maps/collapse
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/maps/mapRowInfo
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function rowNavtitle(node: PMNode, es: EditorSchema): string | undefined`

# Calls

- [childWith](../../../../../functions/src/shared/editor/maps/childWith.md)
- [collapse](../../../../../functions/src/shared/editor/maps/collapse.md)

# Called by

- [mapRowInfo](../../../../../functions/src/shared/editor/maps/mapRowInfo.md)