---
type: TypeScript Function
title: placeLabel
resource: src/preview/mapContext.ts#L274-L276
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/toHtml/basename
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/editor/visualEditorProvider/EditorSession/refreshContext
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/mapContexts/MapContexts/pick
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/contextMeta
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function placeLabel(place: MapPlace): string`

# Calls

- [basename](../../../../functions/src/shared/render/toHtml/basename.md)

# Called by

- [refreshContext](../../../../functions/src/editor/visualEditorProvider/EditorSession/refreshContext.md)
- [pick](../../../../functions/src/preview/mapContexts/MapContexts/pick.md)
- [contextMeta](../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/contextMeta.md)