---
type: TypeScript Function
title: referencesTo
resource: src/preview/mapContext.ts#L111-L130
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/preview/mapContext/referenced
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/mapContext/same
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/mapContext/resourceOnly
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
  - target: functions/src/preview/mapContext/occurrenceAt
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function referencesTo(doc: Document, mapPath: string, topicPath: string, tokensOf: TokensOf): ElementNode[]`

# Calls

- [referenced](../../../../functions/src/preview/mapContext/referenced.md)
- [same](../../../../functions/src/preview/mapContext/same.md)
- [resourceOnly](../../../../functions/src/preview/mapContext/resourceOnly.md)
- [childElements](../../../../functions/src/shared/cst/query/childElements.md)
- [rootElement](../../../../functions/src/shared/cst/query/rootElement.md)

# Called by

- [findPlaces](../../../../functions/src/preview/mapContext/findPlaces.md)
- [occurrenceAt](../../../../functions/src/preview/mapContext/occurrenceAt.md)