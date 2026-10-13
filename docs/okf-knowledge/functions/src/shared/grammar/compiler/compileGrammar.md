---
type: TypeScript Function
title: compileGrammar
resource: src/shared/grammar/compiler.ts#L52-L199
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/grammar/compiler/expandEntities
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/grammar/classTokens/basePlacement
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/grammar/compiler/isForeignByUse
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/grammar/compiler/memberNames
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/grammarRegistry/GrammarRegistry/entries
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/grammar/compiler/expandAttrDefaults
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/grammar/compiler/contentExpression
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/grammar/classTokens/baseToken
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function compileGrammar(raw: RawGrammar, meta: CompileMeta): Grammar`

# Calls

- [expandEntities](../../../../../functions/src/shared/grammar/compiler/expandEntities.md)
- [basePlacement](../../../../../functions/src/shared/grammar/classTokens/basePlacement.md)
- [isForeignByUse](../../../../../functions/src/shared/grammar/compiler/isForeignByUse.md)
- [has](../../../../../functions/src/shared/render/toHtml/Renderer/has.md)
- [memberNames](../../../../../functions/src/shared/grammar/compiler/memberNames.md)
- [entries](../../../../../functions/src/preview/grammarRegistry/GrammarRegistry/entries.md)
- [expandAttrDefaults](../../../../../functions/src/shared/grammar/compiler/expandAttrDefaults.md)
- [contentExpression](../../../../../functions/src/shared/grammar/compiler/contentExpression.md)
- [baseToken](../../../../../functions/src/shared/grammar/classTokens/baseToken.md)