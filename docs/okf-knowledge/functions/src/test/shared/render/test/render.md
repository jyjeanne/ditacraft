---
type: TypeScript Function
title: render
resource: src/test/shared/render.test.ts#L31-L33
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/toHtml/renderDocument
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/shared/render/test/grammarOptions
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function render(src: string, options: RenderOptions = {}): string`

# Calls

- [renderDocument](../../../../../../functions/src/shared/render/toHtml/renderDocument.md)
- [grammarOptions](../../../../../../functions/src/test/shared/render/test/grammarOptions.md)