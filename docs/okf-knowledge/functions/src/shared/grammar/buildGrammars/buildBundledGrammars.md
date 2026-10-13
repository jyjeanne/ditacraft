---
type: TypeScript Function
title: buildBundledGrammars
resource: src/shared/grammar/buildGrammars.ts#L78-L140
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/grammar/catalogShells/discoverShells
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/grammar/buildGrammars/bundledVersionOf
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/basename
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/grammar/typesxmlAdapter/readDtdGrammar
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/grammar/buildGrammars/bundledCatalogFor
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/scripts/compile-grammars/compileGrammars
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function buildBundledGrammars(options: BuildOptions): BuildResult`

# Calls

- [discoverShells](../../../../../functions/src/shared/grammar/catalogShells/discoverShells.md)
- [bundledVersionOf](../../../../../functions/src/shared/grammar/buildGrammars/bundledVersionOf.md)
- [basename](../../../../../functions/src/shared/render/toHtml/basename.md)
- [has](../../../../../functions/src/shared/render/toHtml/Renderer/has.md)
- [readDtdGrammar](../../../../../functions/src/shared/grammar/typesxmlAdapter/readDtdGrammar.md)
- [bundledCatalogFor](../../../../../functions/src/shared/grammar/buildGrammars/bundledCatalogFor.md)

# Called by

- [compileGrammars](../../../../../functions/scripts/compile-grammars/compileGrammars.md)