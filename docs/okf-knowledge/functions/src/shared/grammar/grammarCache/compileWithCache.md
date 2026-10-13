---
type: TypeScript Function
title: compileWithCache
resource: src/shared/grammar/grammarCache.ts#L75-L108
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/grammar/grammarCache/cacheFileFor
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/grammar/grammarCache/isFresh
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/grammar/typesxmlAdapter/readDtdGrammar
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/basename
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/grammar/catalogShells/catalogChain
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/preview/grammarRegistry/GrammarRegistry/compileBundled
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/grammarRegistry/GrammarRegistry/fromExternalCatalog
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function compileWithCache(request: CompileRequest): CompileOutcome`

# Calls

- [cacheFileFor](../../../../../functions/src/shared/grammar/grammarCache/cacheFileFor.md)
- [isFresh](../../../../../functions/src/shared/grammar/grammarCache/isFresh.md)
- [readDtdGrammar](../../../../../functions/src/shared/grammar/typesxmlAdapter/readDtdGrammar.md)
- [basename](../../../../../functions/src/shared/render/toHtml/basename.md)
- [catalogChain](../../../../../functions/src/shared/grammar/catalogShells/catalogChain.md)

# Called by

- [compileBundled](../../../../../functions/src/preview/grammarRegistry/GrammarRegistry/compileBundled.md)
- [fromExternalCatalog](../../../../../functions/src/preview/grammarRegistry/GrammarRegistry/fromExternalCatalog.md)