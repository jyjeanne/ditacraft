---
type: TypeScript Module
title: grammarRegistry
resource: src/preview/grammarRegistry.ts#L1-L239
generated:
  by: okf-rs/0.7.0
relationships:
  imports:
  - target: external/fs
    resolved_by: tree-sitter
    confidence: exact
  - target: external/path
    resolved_by: tree-sitter
    confidence: exact
  - target: external/shared-cst-query
    resolved_by: tree-sitter
    confidence: exact
  - target: external/shared-cst-types
    resolved_by: tree-sitter
    confidence: exact
  - target: external/shared-grammar-grammarcache
    resolved_by: tree-sitter
    confidence: exact
  - target: external/shared-grammar-types
    resolved_by: tree-sitter
    confidence: exact
  - target: external/shared-render-html
    resolved_by: tree-sitter
    confidence: exact
  member_of:
  - target: packages/ditacraft
    resolved_by: tree-sitter
    confidence: exact
---

# Contains

- [SelectedGrammar](../../../interfaces/src/preview/grammarRegistry/SelectedGrammar.md)
- [SelectOptions](../../../interfaces/src/preview/grammarRegistry/SelectOptions.md)
- [CatalogLike](../../../interfaces/src/preview/grammarRegistry/CatalogLike.md)
- [GrammarRegistry](../../../classes/src/preview/grammarRegistry/GrammarRegistry.md)
- [constructor](../../../functions/src/preview/grammarRegistry/GrammarRegistry/constructor.md)
- [select](../../../functions/src/preview/grammarRegistry/GrammarRegistry/select.md)
- [entries](../../../functions/src/preview/grammarRegistry/GrammarRegistry/entries.md)
- [byPublicId](../../../functions/src/preview/grammarRegistry/GrammarRegistry/byPublicId.md)
- [load](../../../functions/src/preview/grammarRegistry/GrammarRegistry/load.md)
- [compileBundled](../../../functions/src/preview/grammarRegistry/GrammarRegistry/compileBundled.md)
- [fromExternalCatalog](../../../functions/src/preview/grammarRegistry/GrammarRegistry/fromExternalCatalog.md)
- [catalog](../../../functions/src/preview/grammarRegistry/GrammarRegistry/catalog.md)
- [reset](../../../functions/src/preview/grammarRegistry/GrammarRegistry/reset.md)
- [versionFor](../../../functions/src/preview/grammarRegistry/versionFor.md)
- [labelOf](../../../functions/src/preview/grammarRegistry/labelOf.md)

# Imports

- `fs`
- `path`
- `../shared/cst/query`
- `../shared/cst/types`
- `../shared/grammar/grammarCache`
- `../shared/grammar/types`
- `../shared/render/html`

# Member of

- [ditacraft](../../../packages/ditacraft.md)