---
type: TypeScript Method
title: insertReference
resource: src/shared/editor/mapCommands.ts#L246-L266
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/mapCommands/MapCommands/referenceElement
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/mapCommands/MapCommands/referencePoint
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/links/linkAttributes
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/images/ImageCommands/insert
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/contextMenu/contextMenu
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/addReference
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/updateUi
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`insertReference(target?: LinkTarget): Command`

# Calls

- [referenceElement](../../../../../../functions/src/shared/editor/mapCommands/MapCommands/referenceElement.md)
- [referencePoint](../../../../../../functions/src/shared/editor/mapCommands/MapCommands/referencePoint.md)
- [linkAttributes](../../../../../../functions/src/shared/editor/links/linkAttributes.md)
- [insert](../../../../../../functions/src/shared/editor/images/ImageCommands/insert.md)

# Called by

- [contextMenu](../../../../../../functions/src/shared/editor/contextMenu/contextMenu.md)
- [addReference](../../../../../../functions/webview/editor/addReference.md)
- [updateUi](../../../../../../functions/webview/editor/updateUi.md)