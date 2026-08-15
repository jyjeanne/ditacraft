---
type: TypeScript Module
title: symbols
resource: server/src/features/symbols.ts#L1-L333
generated:
  by: okf-rs/0.4.0
relationships:
  imports:
  - target: external/fs
    resolved_by: tree-sitter
    confidence: exact
  - target: external/vscode-languageserver-node
    resolved_by: tree-sitter
    confidence: exact
  - target: external/vscode-languageserver-textdocument
    resolved_by: tree-sitter
    confidence: exact
  - target: external/vscode-uri
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-workspacescanner
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-textutils
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-tagstack
    resolved_by: tree-sitter
    confidence: exact
  member_of:
  - target: packages/server
    resolved_by: tree-sitter
    confidence: exact
---

# Contains

- [ParsedTag](../../../../interfaces/server/src/features/symbols/ParsedTag.md)
- [handleDocumentSymbol](../../../../functions/server/src/features/symbols/handleDocumentSymbol.md)
- [parseTags](../../../../functions/server/src/features/symbols/parseTags.md)
- [buildSymbolTree](../../../../functions/server/src/features/symbols/buildSymbolTree.md)
- [extractTextContent](../../../../functions/server/src/features/symbols/extractTextContent.md)
- [handleWorkspaceSymbol](../../../../functions/server/src/features/symbols/handleWorkspaceSymbol.md)
- [extractWorkspaceSymbols](../../../../functions/server/src/features/symbols/extractWorkspaceSymbols.md)

# Imports

- `fs`
- `vscode-languageserver/node`
- `vscode-languageserver-textdocument`
- `vscode-uri`
- `../utils/workspaceScanner`
- `../utils/textUtils`
- `../utils/tagStack`

# Member of

- [ditacraft-lsp-server](../../../../packages/server.md)