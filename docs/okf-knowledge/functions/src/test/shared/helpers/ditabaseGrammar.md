---
type: TypeScript Function
title: ditabaseGrammar
resource: src/test/shared/helpers.ts#L43-L49
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/grammar/typesxmlAdapter/readDtdGrammar
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/test/shared/render/test/grammarOptions
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function ditabaseGrammar(): Grammar`

# Calls

- [readDtdGrammar](../../../../../functions/src/shared/grammar/typesxmlAdapter/readDtdGrammar.md)

# Called by

- [grammarOptions](../../../../../functions/src/test/shared/render/test/grammarOptions.md)