---
type: TypeScript Function
title: rows
resource: src/shared/render/toHtml.ts#L1159-L1171
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/toHtml/Renderer/childrenByToken
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/visible
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/part
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/presEnum
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/attrText
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/cell
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/wrap
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function rows(r: Renderer, section: ElementNode, isHead: boolean, grid: TableGrid | null, headers: HeaderIds | null, pres: TablePresentation, rowheader: boolean): string`

# Calls

- [childrenByToken](../../../../../functions/src/shared/render/toHtml/Renderer/childrenByToken.md)
- [visible](../../../../../functions/src/shared/render/toHtml/Renderer/visible.md)
- [part](../../../../../functions/src/shared/render/toHtml/Renderer/part.md)
- [presEnum](../../../../../functions/src/shared/render/toHtml/presEnum.md)
- [attrText](../../../../../functions/src/shared/render/toHtml/Renderer/attrText.md)
- [cell](../../../../../functions/src/shared/render/toHtml/cell.md)
- [wrap](../../../../../functions/src/shared/render/toHtml/Renderer/wrap.md)