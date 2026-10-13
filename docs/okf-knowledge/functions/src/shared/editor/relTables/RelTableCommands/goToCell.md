---
type: TypeScript Method
title: goToCell
resource: src/shared/editor/relTables.ts#L316-L362
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/relTables/RelTableCommands/selectedCell
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/relTables/RelTableCommands/gridAt
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/relTables/RelTableCommands/selectCell
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/relTables/RelTableCommands/cellPos
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`goToCell(direction: 'next' | 'previous' | 'up' | 'down' | 'left' | 'right', addRow = true): Command`

# Calls

- [selectedCell](../../../../../../functions/src/shared/editor/relTables/RelTableCommands/selectedCell.md)
- [gridAt](../../../../../../functions/src/shared/editor/relTables/RelTableCommands/gridAt.md)
- [selectCell](../../../../../../functions/src/shared/editor/relTables/RelTableCommands/selectCell.md)
- [cellPos](../../../../../../functions/src/shared/editor/relTables/RelTableCommands/cellPos.md)