---
type: TypeScript Method
title: childrenByToken
resource: src/shared/render/toHtml.ts#L295-L297
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/types/isElement
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
  called_by:
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

`childrenByToken(el: ElementNode, token: string): ElementNode[]`

# Calls

- [isElement](../../../../../../functions/src/shared/cst/types/isElement.md)
- [has](../../../../../../functions/src/shared/render/toHtml/Renderer/has.md)

# Called by

- [renderTgroup](../../../../../../functions/src/shared/render/toHtml/renderTgroup.md)
- [rows](../../../../../../functions/src/shared/render/toHtml/rows.md)
- [stCells](../../../../../../functions/src/shared/render/toHtml/stCells.md)