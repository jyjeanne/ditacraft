---
type: TypeScript Function
title: runMenuItem
resource: webview/editor/main.ts#L1030-L1116
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/editable
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/pasteFromClipboard
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/selectedReuse
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/reuseAction
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/pickAndInsertImage
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/replaceImage
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/editAltText
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/pickAndSetLink
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/links/LinkCommands/current
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/showQuickFixes
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/cursorPlace
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/maps/selectedRow
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/maps/mapRowTarget
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/openRowTarget
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/pickRowTarget
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/editRowLabel
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/addReference
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/debug
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function runMenuItem(item: Extract<MenuItem, { kind: 'item' }>): void`

# Calls

- [editable](../../../functions/webview/editor/editable.md)
- [pasteFromClipboard](../../../functions/webview/editor/pasteFromClipboard.md)
- [selectedReuse](../../../functions/webview/editor/selectedReuse.md)
- [reuseAction](../../../functions/webview/editor/reuseAction.md)
- [pickAndInsertImage](../../../functions/webview/editor/pickAndInsertImage.md)
- [replaceImage](../../../functions/webview/editor/replaceImage.md)
- [editAltText](../../../functions/webview/editor/editAltText.md)
- [pickAndSetLink](../../../functions/webview/editor/pickAndSetLink.md)
- [current](../../../functions/src/shared/editor/links/LinkCommands/current.md)
- [showQuickFixes](../../../functions/webview/editor/showQuickFixes.md)
- [cursorPlace](../../../functions/webview/editor/cursorPlace.md)
- [selectedRow](../../../functions/src/shared/editor/maps/selectedRow.md)
- [mapRowTarget](../../../functions/src/shared/editor/maps/mapRowTarget.md)
- [openRowTarget](../../../functions/webview/editor/openRowTarget.md)
- [pickRowTarget](../../../functions/webview/editor/pickRowTarget.md)
- [editRowLabel](../../../functions/webview/editor/mapView/editRowLabel.md)
- [addReference](../../../functions/webview/editor/addReference.md)

# Called by

- [debug](../../../functions/webview/editor/debug.md)