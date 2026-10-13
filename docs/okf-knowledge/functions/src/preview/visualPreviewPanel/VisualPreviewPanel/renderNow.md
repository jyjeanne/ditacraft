---
type: TypeScript Method
title: renderNow
resource: src/preview/visualPreviewPanel.ts#L557-L624
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/labels/format
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/grammarRegistry/GrammarRegistry/select
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/configurationManager/ConfigurationManager/getConfiguration
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/carryResolutions
    resolved_by: tree-sitter
    confidence: exact
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
  - target: functions/src/shared/render/toHtml/basename
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/errorUtils/fireAndForget
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/resolveReferences
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/registerListeners
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/setDocument
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/refreshContext
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/loadDitaval
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/scheduleRender
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/onMessage
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/runCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/toggleMarkup
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/onConfiguration
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private renderNow(): void`

# Calls

- [format](../../../../../functions/src/shared/render/labels/format.md)
- [select](../../../../../functions/src/preview/grammarRegistry/GrammarRegistry/select.md)
- [getConfiguration](../../../../../functions/src/utils/configurationManager/ConfigurationManager/getConfiguration.md)
- [carryResolutions](../../../../../functions/src/preview/visualPreviewPanel/carryResolutions.md)
- [renderDocument](../../../../../functions/src/shared/render/toHtml/renderDocument.md)
- [renderOptions](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/renderOptions.md)
- [meta](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/meta.md)
- [postInfoBanner](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/postInfoBanner.md)
- [basename](../../../../../functions/src/shared/render/toHtml/basename.md)
- [fireAndForget](../../../../../functions/src/utils/errorUtils/fireAndForget.md)
- [resolveReferences](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/resolveReferences.md)

# Called by

- [registerListeners](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/registerListeners.md)
- [setDocument](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/setDocument.md)
- [refreshContext](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/refreshContext.md)
- [loadDitaval](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/loadDitaval.md)
- [scheduleRender](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/scheduleRender.md)
- [onMessage](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/onMessage.md)
- [runCommand](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/runCommand.md)
- [toggleMarkup](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/toggleMarkup.md)
- [onConfiguration](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/onConfiguration.md)