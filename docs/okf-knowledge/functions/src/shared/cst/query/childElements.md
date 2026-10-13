---
type: TypeScript Function
title: childElements
resource: src/shared/cst/query.ts#L20-L22
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/editor/linkTargets/titleOf
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/ditaval/flagStyle
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/mapContext/referencesTo
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/mapContext/submapsOf
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/mapContext/mapTitle
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/mapContext/navtitle
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/ReferenceResolver/titleOfFile
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/ReferenceResolver/mapTitle
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/ReferenceResolver/titleChild
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/siblingRange
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/query/childrenNamed
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/query/firstChildNamed
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/metaRows
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/generatedHeader
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function childElements(el: ElementNode): ElementNode[]`

# Called by

- [titleOf](../../../../../functions/src/editor/linkTargets/titleOf.md)
- [flagStyle](../../../../../functions/src/preview/ditaval/flagStyle.md)
- [referencesTo](../../../../../functions/src/preview/mapContext/referencesTo.md)
- [submapsOf](../../../../../functions/src/preview/mapContext/submapsOf.md)
- [mapTitle](../../../../../functions/src/preview/mapContext/mapTitle.md)
- [navtitle](../../../../../functions/src/preview/mapContext/navtitle.md)
- [titleOfFile](../../../../../functions/src/preview/resolver/ReferenceResolver/titleOfFile.md)
- [mapTitle](../../../../../functions/src/preview/resolver/ReferenceResolver/mapTitle.md)
- [titleChild](../../../../../functions/src/preview/resolver/ReferenceResolver/titleChild.md)
- [siblingRange](../../../../../functions/src/preview/resolver/siblingRange.md)
- [childrenNamed](../../../../../functions/src/shared/cst/query/childrenNamed.md)
- [firstChildNamed](../../../../../functions/src/shared/cst/query/firstChildNamed.md)
- [metaRows](../../../../../functions/src/shared/render/toHtml/metaRows.md)
- [generatedHeader](../../../../../functions/src/shared/render/toHtml/generatedHeader.md)