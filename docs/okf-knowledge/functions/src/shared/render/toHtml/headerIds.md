---
type: TypeScript Function
title: headerIds
resource: src/shared/render/toHtml.ts#L1136-L1157
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/preview/grammarRegistry/GrammarRegistry/entries
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/render/toHtml/renderTgroup
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function headerIds(grid: TableGrid, prefix: string): HeaderIds | null`

# Calls

- [entries](../../../../../functions/src/preview/grammarRegistry/GrammarRegistry/entries.md)

# Called by

- [renderTgroup](../../../../../functions/src/shared/render/toHtml/renderTgroup.md)