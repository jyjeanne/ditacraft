---
type: TypeScript Function
title: decideValues
resource: src/preview/ditaval.ts#L108-L140
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/decode
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/ditavalParser/isExcludedByRules
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/grammarRegistry/GrammarRegistry/entries
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/ditavalParser/governingRule
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/ditaval/ruleKey
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/RowDrag/find
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/preview/ditaval/buildDitavalFilter
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function decideValues(attrs: [string, string][], decode: (value: string) => string, filtering: (name: string) => boolean): FilterDecision | undefined`

# Calls

- [has](../../../../functions/src/shared/render/toHtml/Renderer/has.md)
- [decode](../../../../functions/src/preview/resolver/decode.md)
- [isExcludedByRules](../../../../functions/src/utils/ditavalParser/isExcludedByRules.md)
- [entries](../../../../functions/src/preview/grammarRegistry/GrammarRegistry/entries.md)
- [governingRule](../../../../functions/src/utils/ditavalParser/governingRule.md)
- [ruleKey](../../../../functions/src/preview/ditaval/ruleKey.md)
- [find](../../../../functions/webview/editor/mapView/RowDrag/find.md)

# Called by

- [buildDitavalFilter](../../../../functions/src/preview/ditaval/buildDitavalFilter.md)