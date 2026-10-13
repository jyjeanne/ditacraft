---
type: TypeScript Method
title: reused
resource: src/shared/render/toHtml.ts#L547-L551
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/toHtml/mergeConrefAttrs
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/inReusedContent
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/render/toHtml/Renderer/element
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private reused(el: ElementNode, res: Resolution, target: ElementNode): string`

# Calls

- [mergeConrefAttrs](../../../../../../functions/src/shared/render/toHtml/mergeConrefAttrs.md)
- [inReusedContent](../../../../../../functions/src/shared/render/toHtml/Renderer/inReusedContent.md)

# Called by

- [element](../../../../../../functions/src/shared/render/toHtml/Renderer/element.md)