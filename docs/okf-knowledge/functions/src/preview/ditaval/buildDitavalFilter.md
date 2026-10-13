---
type: TypeScript Function
title: buildDitavalFilter
resource: src/preview/ditaval.ts#L55-L141
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/utils/ditavalParser/parseDitavalRules
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/types/isElement
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/ditaval/flagStyle
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/ditaval/ruleKey
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/basename
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/ditaval/propsSpecializations
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/ditavalParser/isFilteringAttribute
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/ditaval/decideValues
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/grammarRegistry/GrammarRegistry/entries
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/ditavalParser/isExcludedByRules
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/loadDitaval
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditavalDecorationProvider/loadActiveFilter
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function buildDitavalFilter(text: string, ditavalPath: string, imageSrc: (absolutePath: string) => string | undefined = () => undefined): DitavalFilter`

# Calls

- [parseDitavalRules](../../../../functions/src/utils/ditavalParser/parseDitavalRules.md)
- [isElement](../../../../functions/src/shared/cst/types/isElement.md)
- [flagStyle](../../../../functions/src/preview/ditaval/flagStyle.md)
- [ruleKey](../../../../functions/src/preview/ditaval/ruleKey.md)
- [has](../../../../functions/src/shared/render/toHtml/Renderer/has.md)
- [basename](../../../../functions/src/shared/render/toHtml/basename.md)
- [propsSpecializations](../../../../functions/src/preview/ditaval/propsSpecializations.md)
- [isFilteringAttribute](../../../../functions/src/utils/ditavalParser/isFilteringAttribute.md)
- [decideValues](../../../../functions/src/preview/ditaval/decideValues.md)
- [entries](../../../../functions/src/preview/grammarRegistry/GrammarRegistry/entries.md)
- [isExcludedByRules](../../../../functions/src/utils/ditavalParser/isExcludedByRules.md)

# Called by

- [loadDitaval](../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/loadDitaval.md)
- [loadActiveFilter](../../../../functions/src/providers/ditavalDecorationProvider/loadActiveFilter.md)