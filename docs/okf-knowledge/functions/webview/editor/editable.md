---
type: TypeScript Function
title: editable
resource: webview/editor/main.ts#L489-L491
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/webview/editor/columnResize/columnResizing
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/imageResize/imageResizing
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/selectionChain
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/setAttributes
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/run
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/renderMapToolbar
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/menuContext
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/runMenuItem
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/pickRowTarget
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/addReference
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/showQuickFixes
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/makeQuickFix
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/pickAndSetLink
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/insertImages
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/pickAndInsertImage
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/pasteImages
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/dropImages
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/pasteFromClipboard
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/pasteText
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/updateReuseBar
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/reuseAction
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/replaceWithCopy
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/updateUi
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/updateStatus
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/debug
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/mapPlugin
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/MapRowView/listen
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/MapRowView/editLabel
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function editable(): boolean`

# Called by

- [columnResizing](../../../functions/webview/editor/columnResize/columnResizing.md)
- [imageResizing](../../../functions/webview/editor/imageResize/imageResizing.md)
- [selectionChain](../../../functions/webview/editor/selectionChain.md)
- [setAttributes](../../../functions/webview/editor/setAttributes.md)
- [run](../../../functions/webview/editor/run.md)
- [renderMapToolbar](../../../functions/webview/editor/renderMapToolbar.md)
- [menuContext](../../../functions/webview/editor/menuContext.md)
- [runMenuItem](../../../functions/webview/editor/runMenuItem.md)
- [pickRowTarget](../../../functions/webview/editor/pickRowTarget.md)
- [addReference](../../../functions/webview/editor/addReference.md)
- [showQuickFixes](../../../functions/webview/editor/showQuickFixes.md)
- [makeQuickFix](../../../functions/webview/editor/makeQuickFix.md)
- [pickAndSetLink](../../../functions/webview/editor/pickAndSetLink.md)
- [insertImages](../../../functions/webview/editor/insertImages.md)
- [pickAndInsertImage](../../../functions/webview/editor/pickAndInsertImage.md)
- [pasteImages](../../../functions/webview/editor/pasteImages.md)
- [dropImages](../../../functions/webview/editor/dropImages.md)
- [pasteFromClipboard](../../../functions/webview/editor/pasteFromClipboard.md)
- [pasteText](../../../functions/webview/editor/pasteText.md)
- [updateReuseBar](../../../functions/webview/editor/updateReuseBar.md)
- [reuseAction](../../../functions/webview/editor/reuseAction.md)
- [replaceWithCopy](../../../functions/webview/editor/replaceWithCopy.md)
- [updateUi](../../../functions/webview/editor/updateUi.md)
- [updateStatus](../../../functions/webview/editor/updateStatus.md)
- [debug](../../../functions/webview/editor/debug.md)
- [mapPlugin](../../../functions/webview/editor/mapView/mapPlugin.md)
- [listen](../../../functions/webview/editor/mapView/MapRowView/listen.md)
- [editLabel](../../../functions/webview/editor/mapView/MapRowView/editLabel.md)