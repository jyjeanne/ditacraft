---
type: TypeScript Function
title: elementItems
resource: src/shared/editor/contextMenu.ts#L93-L103
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/contextMenu/groupByDomain
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/contextMenu/insertItems
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/contextMenu/contextMenu
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function elementItems(id: string, names: string[], common: string[], make: (name: string) => Command, ctx: MenuContext): MenuItem[]`

# Calls

- [groupByDomain](../../../../../functions/src/shared/editor/contextMenu/groupByDomain.md)

# Called by

- [insertItems](../../../../../functions/src/shared/editor/contextMenu/insertItems.md)
- [contextMenu](../../../../../functions/src/shared/editor/contextMenu/contextMenu.md)