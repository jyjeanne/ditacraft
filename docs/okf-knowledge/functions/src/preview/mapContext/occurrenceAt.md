---
type: TypeScript Function
title: occurrenceAt
resource: src/preview/mapContext.ts#L262-L265
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/preview/mapContext/referencesTo
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/preview/mapContexts/MapContexts/chooseFromMapRow
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function occurrenceAt(doc: Document, mapPath: string, topicPath: string, offset: number, tokensOf: TokensOf): number | undefined`

# Calls

- [referencesTo](../../../../functions/src/preview/mapContext/referencesTo.md)

# Called by

- [chooseFromMapRow](../../../../functions/src/preview/mapContexts/MapContexts/chooseFromMapRow.md)