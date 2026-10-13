---
type: TypeScript Method
title: wrap
resource: src/shared/render/toHtml.ts#L416-L418
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/toHtml/Renderer/attrs
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/render/toHtml/Renderer/conrefRange
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/inlineChild
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/hidden
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/renderTgroup
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/rows
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

`wrap(tag: string, el: ElementNode, info: Info, classes: string, inner: string, extra?: Record<string, string | undefined>, styles?: string[]): string`

# Calls

- [attrs](../../../../../../functions/src/shared/render/toHtml/Renderer/attrs.md)

# Called by

- [conrefRange](../../../../../../functions/src/shared/render/toHtml/Renderer/conrefRange.md)
- [inlineChild](../../../../../../functions/src/shared/render/toHtml/Renderer/inlineChild.md)
- [hidden](../../../../../../functions/src/shared/render/toHtml/Renderer/hidden.md)
- [renderTgroup](../../../../../../functions/src/shared/render/toHtml/renderTgroup.md)
- [rows](../../../../../../functions/src/shared/render/toHtml/rows.md)
- [cell](../../../../../../functions/src/shared/render/toHtml/cell.md)
- [stCells](../../../../../../functions/src/shared/render/toHtml/stCells.md)