---
type: TypeScript Method
title: kids
resource: src/shared/render/toHtml.ts#L450-L479
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/toHtml/Renderer/res
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/types/isElement
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/inReusedContent
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/html/escapeHtml
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/render/toHtml/Renderer/footnoteMarker
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/inlineChild
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/cell
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/stCells
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`kids(el: ElementNode, trim = false, except?: ReadonlySet<ElementNode>): string`

# Calls

- [res](../../../../../../functions/src/shared/render/toHtml/Renderer/res.md)
- [has](../../../../../../functions/src/shared/render/toHtml/Renderer/has.md)
- [isElement](../../../../../../functions/src/shared/cst/types/isElement.md)
- [inReusedContent](../../../../../../functions/src/shared/render/toHtml/Renderer/inReusedContent.md)
- [escapeHtml](../../../../../../functions/src/shared/render/html/escapeHtml.md)

# Called by

- [footnoteMarker](../../../../../../functions/src/shared/render/toHtml/Renderer/footnoteMarker.md)
- [inlineChild](../../../../../../functions/src/shared/render/toHtml/Renderer/inlineChild.md)
- [cell](../../../../../../functions/src/shared/render/toHtml/cell.md)
- [stCells](../../../../../../functions/src/shared/render/toHtml/stCells.md)