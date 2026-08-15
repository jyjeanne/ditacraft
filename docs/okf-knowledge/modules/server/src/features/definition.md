---
type: TypeScript Module
title: definition
resource: server/src/features/definition.ts#L1-L181
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
  - target: external/vscode-uri
    resolved_by: tree-sitter
    confidence: exact
  - target: external/fs
    resolved_by: tree-sitter
    confidence: exact
  - target: external/path
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-referenceparser
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-textutils
    resolved_by: tree-sitter
    confidence: exact
  - target: external/services-keyspaceservice
    resolved_by: tree-sitter
    confidence: exact
  member_of:
  - target: packages/server
    resolved_by: tree-sitter
    confidence: exact
---

# Contains

- [handleDefinition](../../../../functions/server/src/features/definition/handleDefinition.md)
- [resolveInDocument](../../../../functions/server/src/features/definition/resolveInDocument.md)
- [resolveElementInFile](../../../../functions/server/src/features/definition/resolveElementInFile.md)
- [locationAtFileStart](../../../../functions/server/src/features/definition/locationAtFileStart.md)

# Imports

- `vscode-languageserver/node`
- `vscode-languageserver-textdocument`
- `vscode-uri`
- `fs`
- `path`
- `../utils/referenceParser`
- `../utils/textUtils`
- `../services/keySpaceService`

# Member of

- [ditacraft-lsp-server](../../../../packages/server.md)