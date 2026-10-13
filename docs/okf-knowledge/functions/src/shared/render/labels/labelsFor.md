---
type: TypeScript Function
title: labelsFor
resource: src/shared/render/labels.ts#L463-L478
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/editor/visualEditorProvider/EditorSession/postResolved
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/visualEditorProvider/EditorSession/labels
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/mapContexts/MapContexts/pick
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/constructor
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/renderOptions
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/schema/buildEditorSchema
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/constructor
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/shared/editorReused/test/resolve
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/start
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function labelsFor(locale: string | undefined): Labels`

# Called by

- [postResolved](../../../../../functions/src/editor/visualEditorProvider/EditorSession/postResolved.md)
- [labels](../../../../../functions/src/editor/visualEditorProvider/EditorSession/labels.md)
- [pick](../../../../../functions/src/preview/mapContexts/MapContexts/pick.md)
- [constructor](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/constructor.md)
- [renderOptions](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/renderOptions.md)
- [buildEditorSchema](../../../../../functions/src/shared/editor/schema/buildEditorSchema.md)
- [constructor](../../../../../functions/src/shared/render/toHtml/Renderer/constructor.md)
- [resolve](../../../../../functions/src/test/shared/editorReused/test/resolve.md)
- [start](../../../../../functions/webview/editor/start.md)