---
type: TypeScript Method
title: setDocument
resource: src/preview/visualPreviewPanel.ts#L325-L348
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/preview/visualPreviewPanel/isMapPath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/updateTitle
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/updateResources
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/renderNow
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/show
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/revive
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/constructor
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/registerListeners
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/toggleLock
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private setDocument(document: vscode.TextDocument, force: boolean): void`

# Calls

- [isMapPath](../../../../../functions/src/preview/visualPreviewPanel/isMapPath.md)
- [updateTitle](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/updateTitle.md)
- [updateResources](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/updateResources.md)
- [renderNow](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/renderNow.md)

# Called by

- [show](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/show.md)
- [revive](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/revive.md)
- [constructor](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/constructor.md)
- [registerListeners](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/registerListeners.md)
- [toggleLock](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/toggleLock.md)