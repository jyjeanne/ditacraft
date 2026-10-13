---
type: TypeScript Method
title: fromExternalCatalog
resource: src/preview/grammarRegistry.ts#L167-L193
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/preview/grammarRegistry/GrammarRegistry/catalog
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/parse/Scanner/startsWith
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/grammarRegistry/GrammarRegistry/entries
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/RowDrag/find
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/grammarRegistry/labelOf
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/grammar/grammarCache/compileWithCache
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/basename
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/preview/grammarRegistry/GrammarRegistry/select
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private fromExternalCatalog(publicId: string, catalogPath: string): { id: string; grammar: Grammar | undefined; label: string; fallback: boolean } | undefined`

# Calls

- [catalog](../../../../../functions/src/preview/grammarRegistry/GrammarRegistry/catalog.md)
- [startsWith](../../../../../functions/src/shared/cst/parse/Scanner/startsWith.md)
- [entries](../../../../../functions/src/preview/grammarRegistry/GrammarRegistry/entries.md)
- [find](../../../../../functions/webview/editor/mapView/RowDrag/find.md)
- [labelOf](../../../../../functions/src/preview/grammarRegistry/labelOf.md)
- [compileWithCache](../../../../../functions/src/shared/grammar/grammarCache/compileWithCache.md)
- [basename](../../../../../functions/src/shared/render/toHtml/basename.md)

# Called by

- [select](../../../../../functions/src/preview/grammarRegistry/GrammarRegistry/select.md)