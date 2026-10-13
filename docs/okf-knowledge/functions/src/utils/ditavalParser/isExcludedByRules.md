---
type: TypeScript Function
title: isExcludedByRules
resource: src/utils/ditavalParser.ts#L160-L173
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/preview/grammarRegistry/GrammarRegistry/entries
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/ditavalParser/governingRule
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/preview/ditaval/buildDitavalFilter
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/ditaval/decideValues
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function isExcludedByRules(attrs: Record<string, string | undefined>, rules: readonly DitavalRule[], isFiltering: (lowerCaseName: string) => boolean = isFilteringAttribute): boolean`

# Calls

- [entries](../../../../functions/src/preview/grammarRegistry/GrammarRegistry/entries.md)
- [governingRule](../../../../functions/src/utils/ditavalParser/governingRule.md)

# Called by

- [buildDitavalFilter](../../../../functions/src/preview/ditaval/buildDitavalFilter.md)
- [decideValues](../../../../functions/src/preview/ditaval/decideValues.md)