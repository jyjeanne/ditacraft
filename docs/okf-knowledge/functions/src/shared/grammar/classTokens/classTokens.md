---
type: TypeScript Function
title: classTokens
resource: src/shared/grammar/classTokens.ts#L17-L22
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/editor/linkPicker/tokensFor
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/ReferenceResolver/tokens
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/properties/idConflict
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/schema/buildEditorSchema
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/grammar/classTokens/baseToken
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/info
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/tokensOf
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function classTokens(classValue: string | undefined): string[]`

# Called by

- [tokensFor](../../../../../functions/src/editor/linkPicker/tokensFor.md)
- [tokens](../../../../../functions/src/preview/resolver/ReferenceResolver/tokens.md)
- [idConflict](../../../../../functions/src/shared/editor/properties/idConflict.md)
- [buildEditorSchema](../../../../../functions/src/shared/editor/schema/buildEditorSchema.md)
- [baseToken](../../../../../functions/src/shared/grammar/classTokens/baseToken.md)
- [info](../../../../../functions/src/shared/render/toHtml/Renderer/info.md)
- [tokensOf](../../../../../functions/src/shared/render/toHtml/tokensOf.md)