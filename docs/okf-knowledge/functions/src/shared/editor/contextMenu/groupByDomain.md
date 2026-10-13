---
type: TypeScript Function
title: groupByDomain
resource: src/shared/editor/contextMenu.ts#L80-L90
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/contextMenu/domainOf
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/grammarRegistry/GrammarRegistry/entries
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/contextMenu/elementItems
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function groupByDomain(es: EditorSchema, names: string[]): { domain: string; label: string; names: string[] }[]`

# Calls

- [domainOf](../../../../../functions/src/shared/editor/contextMenu/domainOf.md)
- [entries](../../../../../functions/src/preview/grammarRegistry/GrammarRegistry/entries.md)

# Called by

- [elementItems](../../../../../functions/src/shared/editor/contextMenu/elementItems.md)