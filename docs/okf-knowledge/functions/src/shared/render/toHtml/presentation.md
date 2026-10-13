---
type: TypeScript Function
title: presentation
resource: src/shared/render/toHtml.ts#L1094-L1122
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/toHtml/Renderer/attrText
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/presEnum
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/render/toHtml/renderTgroup
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function presentation(r: Renderer, table: ElementNode, tgroup: ElementNode, colspecs: ElementNode[]): TablePresentation`

# Calls

- [attrText](../../../../../functions/src/shared/render/toHtml/Renderer/attrText.md)
- [presEnum](../../../../../functions/src/shared/render/toHtml/presEnum.md)

# Called by

- [renderTgroup](../../../../../functions/src/shared/render/toHtml/renderTgroup.md)