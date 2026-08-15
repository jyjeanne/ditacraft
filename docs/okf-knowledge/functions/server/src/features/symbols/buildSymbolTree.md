---
type: TypeScript Function
title: buildSymbolTree
resource: server/src/features/symbols.ts#L118-L191
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/utils/tagStack/resyncStackToMatch
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/symbols/extractTextContent
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/symbols/handleDocumentSymbol
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function buildSymbolTree(tags: ParsedTag[], document: TextDocument): DocumentSymbol[]`

# Calls

- [resyncStackToMatch](../../../../../functions/server/src/utils/tagStack/resyncStackToMatch.md)
- [extractTextContent](../../../../../functions/server/src/features/symbols/extractTextContent.md)

# Called by

- [handleDocumentSymbol](../../../../../functions/server/src/features/symbols/handleDocumentSymbol.md)