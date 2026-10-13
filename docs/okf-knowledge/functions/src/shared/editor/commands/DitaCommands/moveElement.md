---
type: TypeScript Method
title: moveElement
resource: src/shared/editor/commands.ts#L683-L715
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/commands/DitaCommands/blockAt
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/contextMenu/contextMenu
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`moveElement(direction: -1 | 1): Command`

# Calls

- [blockAt](../../../../../../functions/src/shared/editor/commands/DitaCommands/blockAt.md)

# Called by

- [contextMenu](../../../../../../functions/src/shared/editor/contextMenu/contextMenu.md)