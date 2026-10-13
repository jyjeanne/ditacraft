---
type: TypeScript Method
title: resolveReferences
resource: src/preview/visualPreviewPanel.ts#L680-L717
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/utils/logger/Logger/warn
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/elementIndex/ElementIndex/idOf
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/renderOptions
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/findPatchRoot
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/hasAncestorIn
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/needsFullRender
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/renderDocument
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/meta
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/renderElement
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/scheduleResolve
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/renderNow
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private async resolveReferences(version: number): Promise<void>`

# Calls

- [warn](../../../../../functions/src/utils/logger/Logger/warn.md)
- [idOf](../../../../../functions/src/shared/cst/elementIndex/ElementIndex/idOf.md)
- [has](../../../../../functions/src/shared/render/toHtml/Renderer/has.md)
- [renderOptions](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/renderOptions.md)
- [findPatchRoot](../../../../../functions/src/shared/render/toHtml/findPatchRoot.md)
- [hasAncestorIn](../../../../../functions/src/preview/visualPreviewPanel/hasAncestorIn.md)
- [needsFullRender](../../../../../functions/src/shared/render/toHtml/needsFullRender.md)
- [renderDocument](../../../../../functions/src/shared/render/toHtml/renderDocument.md)
- [meta](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/meta.md)
- [renderElement](../../../../../functions/src/shared/render/toHtml/renderElement.md)

# Called by

- [scheduleResolve](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/scheduleResolve.md)
- [renderNow](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/renderNow.md)