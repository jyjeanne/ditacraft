---
type: TypeScript Function
title: submapsOf
resource: src/preview/mapContext.ts#L133-L149
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/preview/mapContext/referenced
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/query/childElements
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/query/rootElement
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/preview/mapContext/findPlaces
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function submapsOf(doc: Document, mapPath: string, tokensOf: TokensOf): { file: string; el: ElementNode }[]`

# Calls

- [referenced](../../../../functions/src/preview/mapContext/referenced.md)
- [childElements](../../../../functions/src/shared/cst/query/childElements.md)
- [rootElement](../../../../functions/src/shared/cst/query/rootElement.md)

# Called by

- [findPlaces](../../../../functions/src/preview/mapContext/findPlaces.md)