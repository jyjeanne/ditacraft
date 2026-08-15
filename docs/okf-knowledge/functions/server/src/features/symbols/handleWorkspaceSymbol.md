---
type: TypeScript Function
title: handleWorkspaceSymbol
resource: server/src/features/symbols.ts#L211-L263
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
  - target: functions/server/src/features/symbols/extractWorkspaceSymbols
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/test/symbols/test/wsSymbols
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function handleWorkspaceSymbol( params: WorkspaceSymbolParams, documents: TextDocuments<TextDocument>, workspaceFolders?: readonly string[] ): SymbolInformation[]`

# Calls

- [get](../../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)
- [parseTags](../../../../../functions/server/src/features/symbols/parseTags.md)
- [extractWorkspaceSymbols](../../../../../functions/server/src/features/symbols/extractWorkspaceSymbols.md)

# Called by

- [wsSymbols](../../../../../functions/server/test/symbols/test/wsSymbols.md)