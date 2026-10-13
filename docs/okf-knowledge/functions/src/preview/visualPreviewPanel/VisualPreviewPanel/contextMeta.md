---
type: TypeScript Method
title: contextMeta
resource: src/preview/visualPreviewPanel.ts#L669-L677
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/preview/mapContext/placeLabel
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/basename
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/meta
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/debugState
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private contextMeta(): DocMeta['context']`

# Calls

- [placeLabel](../../../../../functions/src/preview/mapContext/placeLabel.md)
- [basename](../../../../../functions/src/shared/render/toHtml/basename.md)

# Called by

- [meta](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/meta.md)
- [debugState](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/debugState.md)