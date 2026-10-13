---
type: TypeScript Function
title: compileBundled
resource: src/test/shared/grammar.test.ts#L28-L39
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/grammar/buildGrammars/bundledVersionOf
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/grammar/typesxmlAdapter/readDtdGrammar
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/grammar/buildGrammars/bundledCatalogFor
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function compileBundled(relShell: string): Grammar`

# Calls

- [bundledVersionOf](../../../../../../functions/src/shared/grammar/buildGrammars/bundledVersionOf.md)
- [readDtdGrammar](../../../../../../functions/src/shared/grammar/typesxmlAdapter/readDtdGrammar.md)
- [bundledCatalogFor](../../../../../../functions/src/shared/grammar/buildGrammars/bundledCatalogFor.md)