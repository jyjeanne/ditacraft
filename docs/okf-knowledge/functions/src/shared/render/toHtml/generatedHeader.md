---
type: TypeScript Function
title: generatedHeader
resource: src/shared/render/toHtml.ts#L1257-L1276
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/html/escapeHtml
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/query/childElements
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function generatedHeader(r: Renderer, info: Info, bodyRows: ElementNode[]): string`

# Calls

- [has](../../../../../functions/src/shared/render/toHtml/Renderer/has.md)
- [escapeHtml](../../../../../functions/src/shared/render/html/escapeHtml.md)
- [childElements](../../../../../functions/src/shared/cst/query/childElements.md)