---
type: TypeScript Function
title: buildPageHtml
resource: src/preview/pageHtml.ts#L36-L65
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/preview/pageHtml/esc
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/editor/visualEditorProvider/EditorSession/html
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/updateResources
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function buildPageHtml(o: PageHtmlOptions): string`

# Calls

- [esc](../../../../functions/src/preview/pageHtml/esc.md)

# Called by

- [html](../../../../functions/src/editor/visualEditorProvider/EditorSession/html.md)
- [updateResources](../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/updateResources.md)