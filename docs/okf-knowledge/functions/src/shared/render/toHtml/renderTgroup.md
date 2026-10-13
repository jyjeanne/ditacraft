---
type: TypeScript Function
title: renderTgroup
resource: src/shared/render/toHtml.ts#L1057-L1092
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/toHtml/Renderer/childrenByToken
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/starWidth
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/attrText
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/html/cssLength
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/presentation
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/tableGrid/computeGrid
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/tableGrid/isGridValid
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/headerIds
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/tableKey
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/childByToken
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/part
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/wrap
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function renderTgroup(r: Renderer, table: ElementNode, tgroup: ElementNode, tgroupIndex: number): string`

# Calls

- [childrenByToken](../../../../../functions/src/shared/render/toHtml/Renderer/childrenByToken.md)
- [starWidth](../../../../../functions/src/shared/render/toHtml/starWidth.md)
- [attrText](../../../../../functions/src/shared/render/toHtml/Renderer/attrText.md)
- [cssLength](../../../../../functions/src/shared/render/html/cssLength.md)
- [presentation](../../../../../functions/src/shared/render/toHtml/presentation.md)
- [computeGrid](../../../../../functions/src/shared/cst/tableGrid/computeGrid.md)
- [isGridValid](../../../../../functions/src/shared/cst/tableGrid/isGridValid.md)
- [headerIds](../../../../../functions/src/shared/render/toHtml/headerIds.md)
- [tableKey](../../../../../functions/src/shared/render/toHtml/Renderer/tableKey.md)
- [childByToken](../../../../../functions/src/shared/render/toHtml/Renderer/childByToken.md)
- [part](../../../../../functions/src/shared/render/toHtml/Renderer/part.md)
- [wrap](../../../../../functions/src/shared/render/toHtml/Renderer/wrap.md)