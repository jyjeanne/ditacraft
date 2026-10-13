---
type: TypeScript Module
title: tables
resource: src/shared/editor/tables.ts#L1-L1172
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
  - target: external/cst-opentag
    resolved_by: tree-sitter
    confidence: exact
  - target: external/columnwidths
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

- [Cell](../../../../interfaces/src/shared/editor/tables/Cell.md)
- [Row](../../../../interfaces/src/shared/editor/tables/Row.md)
- [Section](../../../../interfaces/src/shared/editor/tables/Section.md)
- [Colspec](../../../../interfaces/src/shared/editor/tables/Colspec.md)
- [Grid](../../../../interfaces/src/shared/editor/tables/Grid.md)
- [CellRef](../../../../interfaces/src/shared/editor/tables/CellRef.md)
- [TableCommands](../../../../classes/src/shared/editor/tables/TableCommands.md)
- [constructor](../../../../functions/src/shared/editor/tables/TableCommands/constructor.md)
- [tokens](../../../../functions/src/shared/editor/tables/TableCommands/tokens.md)
- [is](../../../../functions/src/shared/editor/tables/TableCommands/is.md)
- [attr](../../../../functions/src/shared/editor/tables/TableCommands/attr.md)
- [withAttr](../../../../functions/src/shared/editor/tables/TableCommands/withAttr.md)
- [emptyCell](../../../../functions/src/shared/editor/tables/TableCommands/emptyCell.md)
- [grid](../../../../functions/src/shared/editor/tables/TableCommands/grid.md)
- [cellAt](../../../../functions/src/shared/editor/tables/TableCommands/cellAt.md)
- [namedColspecs](../../../../functions/src/shared/editor/tables/TableCommands/namedColspecs.md)
- [rebuild](../../../../functions/src/shared/editor/tables/TableCommands/rebuild.md)
- [withViews](../../../../functions/src/shared/editor/tables/TableCommands/withViews.md)
- [withWidthsView](../../../../functions/src/shared/editor/tables/TableCommands/withWidthsView.md)
- [commit](../../../../functions/src/shared/editor/tables/TableCommands/commit.md)
- [positionOf](../../../../functions/src/shared/editor/tables/TableCommands/positionOf.md)
- [rowsOf](../../../../functions/src/shared/editor/tables/TableCommands/rowsOf.md)
- [addRow](../../../../functions/src/shared/editor/tables/TableCommands/addRow.md)
- [withRowCells](../../../../functions/src/shared/editor/tables/TableCommands/withRowCells.md)
- [addColumn](../../../../functions/src/shared/editor/tables/TableCommands/addColumn.md)
- [mergeContent](../../../../functions/src/shared/editor/tables/TableCommands/mergeContent.md)
- [goToCell](../../../../functions/src/shared/editor/tables/TableCommands/goToCell.md)
- [cellNode](../../../../functions/src/shared/editor/tables/TableCommands/cellNode.md)
- [inTable](../../../../functions/src/shared/editor/tables/TableCommands/inTable.md)
- [firstTgroup](../../../../functions/src/shared/editor/tables/TableCommands/firstTgroup.md)
- [columnWidths](../../../../functions/src/shared/editor/tables/TableCommands/columnWidths.md)
- [setColumnWidths](../../../../functions/src/shared/editor/tables/TableCommands/setColumnWidths.md)
- [simpleAt](../../../../functions/src/shared/editor/tables/TableCommands/simpleAt.md)
- [simpleCommit](../../../../functions/src/shared/editor/tables/TableCommands/simpleCommit.md)
- [replaceRows](../../../../functions/src/shared/editor/tables/TableCommands/replaceRows.md)
- [simpleWidth](../../../../functions/src/shared/editor/tables/TableCommands/simpleWidth.md)
- [simpleAddRow](../../../../functions/src/shared/editor/tables/TableCommands/simpleAddRow.md)
- [simpleDeleteRow](../../../../functions/src/shared/editor/tables/TableCommands/simpleDeleteRow.md)
- [simpleToggleHeader](../../../../functions/src/shared/editor/tables/TableCommands/simpleToggleHeader.md)
- [relcol](../../../../functions/src/shared/editor/tables/TableCommands/relcol.md)
- [simpleAddColumn](../../../../functions/src/shared/editor/tables/TableCommands/simpleAddColumn.md)
- [simpleDeleteColumn](../../../../functions/src/shared/editor/tables/TableCommands/simpleDeleteColumn.md)
- [freshName](../../../../functions/src/shared/editor/tables/freshName.md)
- [firstFree](../../../../functions/src/shared/editor/tables/firstFree.md)
- [cellType](../../../../functions/src/shared/editor/tables/cellType.md)

# Imports

- `prosemirror-model`
- `prosemirror-state`
- `../cst/openTag`
- `./columnWidths`
- `./schema`

# Member of

- [ditacraft](../../../../packages/ditacraft.md)