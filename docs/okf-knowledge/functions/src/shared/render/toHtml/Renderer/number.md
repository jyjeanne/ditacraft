---
type: TypeScript Method
title: number
resource: src/shared/render/toHtml.ts#L178-L212
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/types/isElement
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/childByToken
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/render/toHtml/Renderer/constructor
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private number(nodes: CstNode[]): void`

# Calls

- [has](../../../../../../functions/src/shared/render/toHtml/Renderer/has.md)
- [isElement](../../../../../../functions/src/shared/cst/types/isElement.md)
- [childByToken](../../../../../../functions/src/shared/render/toHtml/Renderer/childByToken.md)

# Called by

- [constructor](../../../../../../functions/src/shared/render/toHtml/Renderer/constructor.md)