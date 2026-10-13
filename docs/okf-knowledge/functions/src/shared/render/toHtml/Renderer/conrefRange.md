---
type: TypeScript Method
title: conrefRange
resource: src/shared/render/toHtml.ts#L573-L577
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/toHtml/Renderer/inReusedContent
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/grammar/classTokens/basePlacement
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/wrap
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/render/toHtml/Renderer/element
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private conrefRange(el: ElementNode, info: Info, res: Resolution, range: ElementNode[]): string`

# Calls

- [inReusedContent](../../../../../../functions/src/shared/render/toHtml/Renderer/inReusedContent.md)
- [basePlacement](../../../../../../functions/src/shared/grammar/classTokens/basePlacement.md)
- [wrap](../../../../../../functions/src/shared/render/toHtml/Renderer/wrap.md)

# Called by

- [element](../../../../../../functions/src/shared/render/toHtml/Renderer/element.md)