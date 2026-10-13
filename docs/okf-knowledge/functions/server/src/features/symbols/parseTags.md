---
type: TypeScript Function
title: parseTags
resource: server/src/features/symbols.ts#L86-L113
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/mcp/src/resources/query/OptionalQueryTemplate/match
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/symbols/handleDocumentSymbol
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/symbols/handleWorkspaceSymbol
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function parseTags(text: string): ParsedTag[]`

# Calls

- [match](../../../../../functions/mcp/src/resources/query/OptionalQueryTemplate/match.md)

# Called by

- [handleDocumentSymbol](../../../../../functions/server/src/features/symbols/handleDocumentSymbol.md)
- [handleWorkspaceSymbol](../../../../../functions/server/src/features/symbols/handleWorkspaceSymbol.md)