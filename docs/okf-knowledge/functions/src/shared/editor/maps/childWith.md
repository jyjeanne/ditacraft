---
type: TypeScript Function
title: childWith
resource: src/shared/editor/maps.ts#L95-L103
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/shared/editor/maps/rowNavtitle
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/maps/rowKeyword
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function childWith(node: PMNode, es: EditorSchema, token: string): PMNode | undefined`

# Called by

- [rowNavtitle](../../../../../functions/src/shared/editor/maps/rowNavtitle.md)
- [rowKeyword](../../../../../functions/src/shared/editor/maps/rowKeyword.md)