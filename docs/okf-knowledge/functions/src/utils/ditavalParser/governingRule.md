---
type: TypeScript Function
title: governingRule
resource: src/utils/ditavalParser.ts#L183-L189
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/mapView/RowDrag/find
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/preview/ditaval/decideValues
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/ditavalParser/isExcludedByRules
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function governingRule(lowerCaseName: string, token: string, rules: readonly DitavalRule[], isFiltering: (lowerCaseName: string) => boolean = isFilteringAttribute): DitavalRule | undefined`

# Calls

- [find](../../../../functions/webview/editor/mapView/RowDrag/find.md)

# Called by

- [decideValues](../../../../functions/src/preview/ditaval/decideValues.md)
- [isExcludedByRules](../../../../functions/src/utils/ditavalParser/isExcludedByRules.md)