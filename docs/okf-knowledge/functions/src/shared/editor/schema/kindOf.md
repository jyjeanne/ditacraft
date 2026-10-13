---
type: TypeScript Function
title: kindOf
resource: src/shared/editor/schema.ts#L138-L153
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/grammar/classTokens/basePlacement
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/schema/buildEditorSchema
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function kindOf(el: GrammarElement, tokens: string[], context: 'block' | 'inline'): ElementKind`

# Calls

- [has](../../../../../functions/src/shared/render/toHtml/Renderer/has.md)
- [basePlacement](../../../../../functions/src/shared/grammar/classTokens/basePlacement.md)

# Called by

- [buildEditorSchema](../../../../../functions/src/shared/editor/schema/buildEditorSchema.md)