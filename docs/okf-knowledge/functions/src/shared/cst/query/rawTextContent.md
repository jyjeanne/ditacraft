---
type: TypeScript Function
title: rawTextContent
resource: src/shared/cst/query.ts#L108-L116
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/editor/linkTargets/plainText
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/ditaval/flagStyle
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/mapContext/plain
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/ReferenceResolver/plainText
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toProseMirror/Builder/opaqueView
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/hidden
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function rawTextContent(el: ElementNode): string`

# Called by

- [plainText](../../../../../functions/src/editor/linkTargets/plainText.md)
- [flagStyle](../../../../../functions/src/preview/ditaval/flagStyle.md)
- [plain](../../../../../functions/src/preview/mapContext/plain.md)
- [plainText](../../../../../functions/src/preview/resolver/ReferenceResolver/plainText.md)
- [opaqueView](../../../../../functions/src/shared/editor/toProseMirror/Builder/opaqueView.md)
- [hidden](../../../../../functions/src/shared/render/toHtml/Renderer/hidden.md)