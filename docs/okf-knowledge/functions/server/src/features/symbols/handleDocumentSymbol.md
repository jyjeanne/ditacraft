---
type: TypeScript Function
title: handleDocumentSymbol
resource: server/src/features/symbols.ts#L69-L81
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/configurationManager/ConfigurationManager/get
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/symbols/parseTags
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/symbols/buildSymbolTree
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/test/symbols/test/symbols
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function handleDocumentSymbol( params: DocumentSymbolParams, documents: TextDocuments<TextDocument> ): DocumentSymbol[]`

# Calls

- [get](../../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)
- [parseTags](../../../../../functions/server/src/features/symbols/parseTags.md)
- [buildSymbolTree](../../../../../functions/server/src/features/symbols/buildSymbolTree.md)

# Called by

- [symbols](../../../../../functions/server/test/symbols/test/symbols.md)