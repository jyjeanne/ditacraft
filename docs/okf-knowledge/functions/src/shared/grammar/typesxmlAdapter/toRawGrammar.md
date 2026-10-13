---
type: TypeScript Function
title: toRawGrammar
resource: src/shared/grammar/typesxmlAdapter.ts#L121-L170
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/grammar/typesxmlAdapter/readAttributes
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/parse/Scanner/startsWith
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/grammar/typesxmlAdapter/readDtdGrammar
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function toRawGrammar(tx: TypesXmlModule, grammar: TxDtdGrammar): RawGrammar`

# Calls

- [readAttributes](../../../../../functions/src/shared/grammar/typesxmlAdapter/readAttributes.md)
- [startsWith](../../../../../functions/src/shared/cst/parse/Scanner/startsWith.md)

# Called by

- [readDtdGrammar](../../../../../functions/src/shared/grammar/typesxmlAdapter/readDtdGrammar.md)