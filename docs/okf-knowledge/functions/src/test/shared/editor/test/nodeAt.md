---
type: TypeScript Function
title: nodeAt
resource: src/test/shared/editor.test.ts#L72-L83
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/shared/editor/commands/DitaCommands/normalize
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/mapCommands/MapCommands/moveRow
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/mapCommands/MapCommands/movable
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/mapCommands/MapCommands/dropPosition
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/mapCommands/MapCommands/setLabel
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/problems/problemMarks
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/relTables/RelTableCommands/selectCell
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/reused/resolvedTargets
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/tables/TableCommands/columnWidths
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/tables/TableCommands/setColumnWidths
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/shared/editorProblems/test/nodeName
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/shared/editorSourcePositions/test/nameAt
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/followMoves
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/showResolved
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/reveal
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/nextProblem
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/setAttributes
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/showRowTitle
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/replaceImage
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/editAltText
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/setFold
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/restoreFolds
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/dropTarget
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function nodeAt(doc: PMNode, typeName: string, nth = 0): { node: PMNode; pos: number }`

# Called by

- [normalize](../../../../../../functions/src/shared/editor/commands/DitaCommands/normalize.md)
- [moveRow](../../../../../../functions/src/shared/editor/mapCommands/MapCommands/moveRow.md)
- [movable](../../../../../../functions/src/shared/editor/mapCommands/MapCommands/movable.md)
- [dropPosition](../../../../../../functions/src/shared/editor/mapCommands/MapCommands/dropPosition.md)
- [setLabel](../../../../../../functions/src/shared/editor/mapCommands/MapCommands/setLabel.md)
- [problemMarks](../../../../../../functions/src/shared/editor/problems/problemMarks.md)
- [selectCell](../../../../../../functions/src/shared/editor/relTables/RelTableCommands/selectCell.md)
- [resolvedTargets](../../../../../../functions/src/shared/editor/reused/resolvedTargets.md)
- [columnWidths](../../../../../../functions/src/shared/editor/tables/TableCommands/columnWidths.md)
- [setColumnWidths](../../../../../../functions/src/shared/editor/tables/TableCommands/setColumnWidths.md)
- [nodeName](../../../../../../functions/src/test/shared/editorProblems/test/nodeName.md)
- [nameAt](../../../../../../functions/src/test/shared/editorSourcePositions/test/nameAt.md)
- [followMoves](../../../../../../functions/webview/editor/followMoves.md)
- [showResolved](../../../../../../functions/webview/editor/showResolved.md)
- [reveal](../../../../../../functions/webview/editor/reveal.md)
- [nextProblem](../../../../../../functions/webview/editor/nextProblem.md)
- [setAttributes](../../../../../../functions/webview/editor/setAttributes.md)
- [showRowTitle](../../../../../../functions/webview/editor/showRowTitle.md)
- [replaceImage](../../../../../../functions/webview/editor/replaceImage.md)
- [editAltText](../../../../../../functions/webview/editor/editAltText.md)
- [setFold](../../../../../../functions/webview/editor/mapView/setFold.md)
- [restoreFolds](../../../../../../functions/webview/editor/mapView/restoreFolds.md)
- [dropTarget](../../../../../../functions/webview/editor/mapView/dropTarget.md)