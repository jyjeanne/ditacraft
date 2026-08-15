---
type: TypeScript Module
title: formatting
resource: server/src/features/formatting.ts#L1-L327
generated:
  by: okf-rs/0.4.0
relationships:
  imports:
  - target: external/vscode-languageserver-node
    resolved_by: tree-sitter
    confidence: exact
  - target: external/vscode-languageserver-textdocument
    resolved_by: tree-sitter
    confidence: exact
  member_of:
  - target: packages/server
    resolved_by: tree-sitter
    confidence: exact
---

# Contains

- [XMLToken](../../../../interfaces/server/src/features/formatting/XMLToken.md)
- [handleFormatting](../../../../functions/server/src/features/formatting/handleFormatting.md)
- [handleRangeFormatting](../../../../functions/server/src/features/formatting/handleRangeFormatting.md)
- [formatXML](../../../../functions/server/src/features/formatting/formatXML.md)
- [flush](../../../../functions/server/src/features/formatting/flush.md)
- [tokenize](../../../../functions/server/src/features/formatting/tokenize.md)
- [getSimpleTextContent](../../../../functions/server/src/features/formatting/getSimpleTextContent.md)
- [detectEOL](../../../../functions/server/src/features/formatting/detectEOL.md)

# Imports

- `vscode-languageserver/node`
- `vscode-languageserver-textdocument`

# Member of

- [ditacraft-lsp-server](../../../../packages/server.md)