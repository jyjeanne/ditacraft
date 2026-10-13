---
type: TypeScript Method
title: insert
resource: src/shared/editor/images.ts#L184-L227
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/images/ImageCommands/inlineOk
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/images/ImageCommands/imageNode
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/images/ImageCommands/breakPlan
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/images/ImageCommands/blockTarget
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/images/ImageCommands/figure
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/commands/DitaCommands/insertAfter
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/commands/DitaCommands/leaveList
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/commands/DitaCommands/insertBlock
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/commands/DitaCommands/insertTable
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/mapCommands/MapCommands/moveRow
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/mapCommands/MapCommands/insertReference
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/mapCommands/MapCommands/setLabel
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/relTables/RelTableCommands/insertRelTable
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/relTables/RelTableCommands/addRow
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/relTables/RelTableCommands/addColumn
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/tables/TableCommands/setColumnWidths
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/editorInsertUtils/insertAtCursor
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/insertImages
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`insert(placement: ImagePlacement, spec?: ImageSpec): Command`

# Calls

- [inlineOk](../../../../../../functions/src/shared/editor/images/ImageCommands/inlineOk.md)
- [imageNode](../../../../../../functions/src/shared/editor/images/ImageCommands/imageNode.md)
- [breakPlan](../../../../../../functions/src/shared/editor/images/ImageCommands/breakPlan.md)
- [blockTarget](../../../../../../functions/src/shared/editor/images/ImageCommands/blockTarget.md)
- [figure](../../../../../../functions/src/shared/editor/images/ImageCommands/figure.md)

# Called by

- [insertAfter](../../../../../../functions/src/shared/editor/commands/DitaCommands/insertAfter.md)
- [leaveList](../../../../../../functions/src/shared/editor/commands/DitaCommands/leaveList.md)
- [insertBlock](../../../../../../functions/src/shared/editor/commands/DitaCommands/insertBlock.md)
- [insertTable](../../../../../../functions/src/shared/editor/commands/DitaCommands/insertTable.md)
- [moveRow](../../../../../../functions/src/shared/editor/mapCommands/MapCommands/moveRow.md)
- [insertReference](../../../../../../functions/src/shared/editor/mapCommands/MapCommands/insertReference.md)
- [setLabel](../../../../../../functions/src/shared/editor/mapCommands/MapCommands/setLabel.md)
- [insertRelTable](../../../../../../functions/src/shared/editor/relTables/RelTableCommands/insertRelTable.md)
- [addRow](../../../../../../functions/src/shared/editor/relTables/RelTableCommands/addRow.md)
- [addColumn](../../../../../../functions/src/shared/editor/relTables/RelTableCommands/addColumn.md)
- [setColumnWidths](../../../../../../functions/src/shared/editor/tables/TableCommands/setColumnWidths.md)
- [insertAtCursor](../../../../../../functions/src/utils/editorInsertUtils/insertAtCursor.md)
- [insertImages](../../../../../../functions/webview/editor/insertImages.md)