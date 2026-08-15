---
type: TypeScript Function
title: wsSymbols
resource: server/test/symbols.test.ts#L177-L184
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/test/helper/createDocs
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/symbols/handleWorkspaceSymbol
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function wsSymbols(query: string, workspaceFolders?: string[])`

# Calls

- [createDocs](../../../../../functions/server/test/helper/createDocs.md)
- [handleWorkspaceSymbol](../../../../../functions/server/src/features/symbols/handleWorkspaceSymbol.md)