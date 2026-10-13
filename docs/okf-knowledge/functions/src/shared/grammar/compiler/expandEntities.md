---
type: TypeScript Function
title: expandEntities
resource: src/shared/grammar/compiler.ts#L285-L328
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/grammar/compiler/expandText
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/grammar/compiler/compileGrammar
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function expandEntities(rawEntities: Map<string, string>): Record<string, string>`

# Calls

- [has](../../../../../functions/src/shared/render/toHtml/Renderer/has.md)
- [expandText](../../../../../functions/src/shared/grammar/compiler/expandText.md)

# Called by

- [compileGrammar](../../../../../functions/src/shared/grammar/compiler/compileGrammar.md)