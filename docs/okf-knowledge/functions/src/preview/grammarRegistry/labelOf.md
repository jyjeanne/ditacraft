---
type: TypeScript Function
title: labelOf
resource: src/preview/grammarRegistry.ts#L236-L239
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/toHtml/basename
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/preview/grammarRegistry/GrammarRegistry/select
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/grammarRegistry/GrammarRegistry/fromExternalCatalog
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function labelOf(entry: GrammarIndexEntry): string`

# Calls

- [basename](../../../../functions/src/shared/render/toHtml/basename.md)

# Called by

- [select](../../../../functions/src/preview/grammarRegistry/GrammarRegistry/select.md)
- [fromExternalCatalog](../../../../functions/src/preview/grammarRegistry/GrammarRegistry/fromExternalCatalog.md)