---
type: TypeScript Function
title: extractWorkspaceSymbols
resource: server/src/features/symbols.ts#L269-L333
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
  - target: functions/server/src/features/symbols/handleWorkspaceSymbol
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function extractWorkspaceSymbols( tags: ParsedTag[], text: string, fileUri: string, openDoc?: TextDocument ): SymbolInformation[]`

# Calls

- [resyncStackToMatch](../../../../../functions/server/src/utils/tagStack/resyncStackToMatch.md)
- [extractTextContent](../../../../../functions/server/src/features/symbols/extractTextContent.md)

# Called by

- [handleWorkspaceSymbol](../../../../../functions/server/src/features/symbols/handleWorkspaceSymbol.md)