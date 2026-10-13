---
type: TypeScript Function
title: format
resource: src/shared/render/labels.ts#L481-L483
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/editor/linkPicker/pickLinkTarget
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/visualEditorProvider/EditorSession/handle
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/visualEditorProvider/EditorSession/images
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/contextExclusion
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/renderNow
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/postInfoBanner
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/resolutionAttrs
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/problemText
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/pauseMessage
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/showQuickFixes
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/makeQuickFix
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/pickAndInsertImage
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/insertImageData
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/reuseResult
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/replaceWithCopy
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/updateStatus
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function format(template: string, ...args: (string | number)[]): string`

# Called by

- [pickLinkTarget](../../../../../functions/src/editor/linkPicker/pickLinkTarget.md)
- [handle](../../../../../functions/src/editor/visualEditorProvider/EditorSession/handle.md)
- [images](../../../../../functions/src/editor/visualEditorProvider/EditorSession/images.md)
- [contextExclusion](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/contextExclusion.md)
- [renderNow](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/renderNow.md)
- [postInfoBanner](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/postInfoBanner.md)
- [resolutionAttrs](../../../../../functions/src/shared/render/toHtml/Renderer/resolutionAttrs.md)
- [problemText](../../../../../functions/webview/editor/problemText.md)
- [pauseMessage](../../../../../functions/webview/editor/pauseMessage.md)
- [showQuickFixes](../../../../../functions/webview/editor/showQuickFixes.md)
- [makeQuickFix](../../../../../functions/webview/editor/makeQuickFix.md)
- [pickAndInsertImage](../../../../../functions/webview/editor/pickAndInsertImage.md)
- [insertImageData](../../../../../functions/webview/editor/insertImageData.md)
- [reuseResult](../../../../../functions/webview/editor/reuseResult.md)
- [replaceWithCopy](../../../../../functions/webview/editor/replaceWithCopy.md)
- [updateStatus](../../../../../functions/webview/editor/updateStatus.md)