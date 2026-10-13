---
type: TypeScript Method
title: catalog
resource: src/preview/grammarRegistry.ts#L195-L207
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/preview/grammarRegistry/GrammarRegistry/fromExternalCatalog
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private catalog(catalogPath: string): CatalogLike | null`

# Calls

- [has](../../../../../functions/src/shared/render/toHtml/Renderer/has.md)

# Called by

- [fromExternalCatalog](../../../../../functions/src/preview/grammarRegistry/GrammarRegistry/fromExternalCatalog.md)