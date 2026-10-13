---
type: TypeScript Method
title: loadDitaval
resource: src/preview/visualPreviewPanel.ts#L403-L415
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/ditavalPath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/renderNow
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/errorUtils/fireAndForget
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/readText
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/ditaval/buildDitavalFilter
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/constructor
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/registerListeners
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private loadDitaval(): void`

# Calls

- [ditavalPath](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/ditavalPath.md)
- [renderNow](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/renderNow.md)
- [fireAndForget](../../../../../functions/src/utils/errorUtils/fireAndForget.md)
- [readText](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/readText.md)
- [buildDitavalFilter](../../../../../functions/src/preview/ditaval/buildDitavalFilter.md)

# Called by

- [constructor](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/constructor.md)
- [registerListeners](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/registerListeners.md)