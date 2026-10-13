---
type: TypeScript Function
title: expandAttrDefaults
resource: src/shared/grammar/compiler.ts#L368-L383
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/preview/grammarRegistry/GrammarRegistry/entries
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

`function expandAttrDefaults( attrs: Record<string, GrammarAttribute>, entities: Record<string, string>, ): Record<string, GrammarAttribute>`

# Calls

- [entries](../../../../../functions/src/preview/grammarRegistry/GrammarRegistry/entries.md)
- [expandText](../../../../../functions/src/shared/grammar/compiler/expandText.md)

# Called by

- [compileGrammar](../../../../../functions/src/shared/grammar/compiler/compileGrammar.md)