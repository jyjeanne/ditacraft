---
type: TypeScript Method
title: part
resource: src/shared/render/toHtml.ts#L515-L539
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/injectFlags
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/utils/referenceParser/referencePartAtOffset
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/element
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/inlineChild
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/renderTgroup
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/rows
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/stCells
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`part(el: ElementNode, render: (info: Info) => string, markers = true): string`

# Calls

- [has](../../../../../../functions/src/shared/render/toHtml/Renderer/has.md)
- [injectFlags](../../../../../../functions/src/shared/render/toHtml/Renderer/injectFlags.md)

# Called by

- [referencePartAtOffset](../../../../../../functions/server/src/utils/referenceParser/referencePartAtOffset.md)
- [element](../../../../../../functions/src/shared/render/toHtml/Renderer/element.md)
- [inlineChild](../../../../../../functions/src/shared/render/toHtml/Renderer/inlineChild.md)
- [renderTgroup](../../../../../../functions/src/shared/render/toHtml/renderTgroup.md)
- [rows](../../../../../../functions/src/shared/render/toHtml/rows.md)
- [stCells](../../../../../../functions/src/shared/render/toHtml/stCells.md)