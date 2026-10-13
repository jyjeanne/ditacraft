---
type: TypeScript Method
title: inReusedContent
resource: src/shared/render/toHtml.ts#L554-L571
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/shared/render/toHtml/Renderer/kids
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/reused
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/conrefRange
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private inReusedContent<T>(key: object, res: Resolution, render: () => T): T`

# Called by

- [kids](../../../../../../functions/src/shared/render/toHtml/Renderer/kids.md)
- [reused](../../../../../../functions/src/shared/render/toHtml/Renderer/reused.md)
- [conrefRange](../../../../../../functions/src/shared/render/toHtml/Renderer/conrefRange.md)