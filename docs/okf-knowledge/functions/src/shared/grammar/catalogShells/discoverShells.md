---
type: TypeScript Function
title: discoverShells
resource: src/shared/grammar/catalogShells.ts#L67-L94
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/grammar/catalogShells/catalogChain
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/grammar/catalogShells/readCatalog
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/grammar/catalogShells/attributes
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/grammarRegistry/GrammarRegistry/entries
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/grammar/buildGrammars/buildBundledGrammars
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function discoverShells(catalogPath: string): CatalogShell[]`

# Calls

- [catalogChain](../../../../../functions/src/shared/grammar/catalogShells/catalogChain.md)
- [readCatalog](../../../../../functions/src/shared/grammar/catalogShells/readCatalog.md)
- [attributes](../../../../../functions/src/shared/grammar/catalogShells/attributes.md)
- [has](../../../../../functions/src/shared/render/toHtml/Renderer/has.md)
- [entries](../../../../../functions/src/preview/grammarRegistry/GrammarRegistry/entries.md)

# Called by

- [buildBundledGrammars](../../../../../functions/src/shared/grammar/buildGrammars/buildBundledGrammars.md)