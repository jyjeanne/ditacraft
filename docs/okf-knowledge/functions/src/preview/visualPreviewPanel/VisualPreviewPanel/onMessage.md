---
type: TypeScript Method
title: onMessage
resource: src/preview/visualPreviewPanel.ts#L762-L808
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/toHtml/renderDocument
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/renderOptions
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/meta
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/postInfoBanner
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/renderNow
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/isCurrentPage
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/revealInEditor
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/errorUtils/fireAndForget
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/runCommand
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/constructor
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private onMessage(message: WebviewToHost): void`

# Calls

- [renderDocument](../../../../../functions/src/shared/render/toHtml/renderDocument.md)
- [renderOptions](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/renderOptions.md)
- [meta](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/meta.md)
- [postInfoBanner](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/postInfoBanner.md)
- [renderNow](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/renderNow.md)
- [isCurrentPage](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/isCurrentPage.md)
- [revealInEditor](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/revealInEditor.md)
- [fireAndForget](../../../../../functions/src/utils/errorUtils/fireAndForget.md)
- [runCommand](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/runCommand.md)

# Called by

- [constructor](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/constructor.md)