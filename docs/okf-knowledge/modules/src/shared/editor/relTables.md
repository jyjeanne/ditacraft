---
type: TypeScript Module
title: relTables
resource: src/shared/editor/relTables.ts#L1-L375
generated:
  by: okf-rs/0.7.0
relationships:
  imports:
  - target: external/prosemirror-model
    resolved_by: tree-sitter
    confidence: exact
  - target: external/prosemirror-state
    resolved_by: tree-sitter
    confidence: exact
  - target: external/commands
    resolved_by: tree-sitter
    confidence: exact
  - target: external/schema
    resolved_by: tree-sitter
    confidence: exact
  member_of:
  - target: packages/ditacraft
    resolved_by: tree-sitter
    confidence: exact
---

# Contains

- [RelGrid](../../../../interfaces/src/shared/editor/relTables/RelGrid.md)
- [RelTableCommands](../../../../classes/src/shared/editor/relTables/RelTableCommands.md)
- [constructor](../../../../functions/src/shared/editor/relTables/RelTableCommands/constructor.md)
- [tokens](../../../../functions/src/shared/editor/relTables/RelTableCommands/tokens.md)
- [is](../../../../functions/src/shared/editor/relTables/RelTableCommands/is.md)
- [isCell](../../../../functions/src/shared/editor/relTables/RelTableCommands/isCell.md)
- [isGridPart](../../../../functions/src/shared/editor/relTables/RelTableCommands/isGridPart.md)
- [isGridElement](../../../../functions/src/shared/editor/relTables/RelTableCommands/isGridElement.md)
- [selectedCell](../../../../functions/src/shared/editor/relTables/RelTableCommands/selectedCell.md)
- [typeOf](../../../../functions/src/shared/editor/relTables/RelTableCommands/typeOf.md)
- [gridAt](../../../../functions/src/shared/editor/relTables/RelTableCommands/gridAt.md)
- [gridOf](../../../../functions/src/shared/editor/relTables/RelTableCommands/gridOf.md)
- [inRelTable](../../../../functions/src/shared/editor/relTables/RelTableCommands/inRelTable.md)
- [cellPos](../../../../functions/src/shared/editor/relTables/RelTableCommands/cellPos.md)
- [newRow](../../../../functions/src/shared/editor/relTables/RelTableCommands/newRow.md)
- [selectCell](../../../../functions/src/shared/editor/relTables/RelTableCommands/selectCell.md)
- [insertRelTable](../../../../functions/src/shared/editor/relTables/RelTableCommands/insertRelTable.md)
- [addRow](../../../../functions/src/shared/editor/relTables/RelTableCommands/addRow.md)
- [moveRow](../../../../functions/src/shared/editor/relTables/RelTableCommands/moveRow.md)
- [addColumn](../../../../functions/src/shared/editor/relTables/RelTableCommands/addColumn.md)
- [goToCell](../../../../functions/src/shared/editor/relTables/RelTableCommands/goToCell.md)
- [childPos](../../../../functions/src/shared/editor/relTables/childPos.md)

# Imports

- `prosemirror-model`
- `prosemirror-state`
- `./commands`
- `./schema`

# Member of

- [ditacraft](../../../../packages/ditacraft.md)