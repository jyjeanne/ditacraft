---
type: TypeScript Function
title: isForeignByUse
resource: src/shared/grammar/compiler.ts#L206-L219
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/grammar/compiler/memberNames
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/grammar/compiler/compileGrammar
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function isForeignByUse(name: string, raw: RawGrammar): boolean`

# Calls

- [memberNames](../../../../../functions/src/shared/grammar/compiler/memberNames.md)
- [has](../../../../../functions/src/shared/render/toHtml/Renderer/has.md)

# Called by

- [compileGrammar](../../../../../functions/src/shared/grammar/compiler/compileGrammar.md)