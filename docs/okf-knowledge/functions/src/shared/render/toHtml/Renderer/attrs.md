---
type: TypeScript Method
title: attrs
resource: src/shared/render/toHtml.ts#L333-L391
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/toHtml/Renderer/attrText
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/flagCss
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/res
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/structId
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/presEnum
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/resolutionAttrs
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/grammarRegistry/GrammarRegistry/entries
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/render/toHtml/Renderer/wrap
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`attrs(el: ElementNode, info: Info, classes: string, extra: Record<string, string | undefined> = {}, styles: string[] = []): string`

# Calls

- [attrText](../../../../../../functions/src/shared/render/toHtml/Renderer/attrText.md)
- [flagCss](../../../../../../functions/src/shared/render/toHtml/flagCss.md)
- [res](../../../../../../functions/src/shared/render/toHtml/Renderer/res.md)
- [structId](../../../../../../functions/src/shared/render/toHtml/Renderer/structId.md)
- [presEnum](../../../../../../functions/src/shared/render/toHtml/presEnum.md)
- [resolutionAttrs](../../../../../../functions/src/shared/render/toHtml/Renderer/resolutionAttrs.md)
- [entries](../../../../../../functions/src/preview/grammarRegistry/GrammarRegistry/entries.md)

# Called by

- [wrap](../../../../../../functions/src/shared/render/toHtml/Renderer/wrap.md)