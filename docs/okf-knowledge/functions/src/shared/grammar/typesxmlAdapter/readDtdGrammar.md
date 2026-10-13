---
type: TypeScript Function
title: readDtdGrammar
resource: src/shared/grammar/typesxmlAdapter.ts#L80-L119
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/grammar/typesxmlAdapter/loadTypesXml
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/grammar/typesxmlAdapter/toRawGrammar
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/grammar/buildGrammars/buildBundledGrammars
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/grammar/grammarCache/compileWithCache
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/shared/editorMaps/test/compile
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/shared/grammar/test/compileBundled
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/shared/helpers/ditabaseGrammar
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function readDtdGrammar(shellPath: string, catalogPath?: string): DtdReadResult`

# Calls

- [loadTypesXml](../../../../../functions/src/shared/grammar/typesxmlAdapter/loadTypesXml.md)
- [toRawGrammar](../../../../../functions/src/shared/grammar/typesxmlAdapter/toRawGrammar.md)

# Called by

- [buildBundledGrammars](../../../../../functions/src/shared/grammar/buildGrammars/buildBundledGrammars.md)
- [compileWithCache](../../../../../functions/src/shared/grammar/grammarCache/compileWithCache.md)
- [compile](../../../../../functions/src/test/shared/editorMaps/test/compile.md)
- [compileBundled](../../../../../functions/src/test/shared/grammar/test/compileBundled.md)
- [ditabaseGrammar](../../../../../functions/src/test/shared/helpers/ditabaseGrammar.md)