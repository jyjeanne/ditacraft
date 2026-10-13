---
type: TypeScript Function
title: mergeConrefAttrs
resource: src/shared/render/toHtml.ts#L124-L132
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/render/toHtml/Renderer/reused
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function mergeConrefAttrs(target: ElementNode, referencing: ElementNode): ElementNode['attrs']`

# Calls

- [has](../../../../../functions/src/shared/render/toHtml/Renderer/has.md)

# Called by

- [reused](../../../../../functions/src/shared/render/toHtml/Renderer/reused.md)