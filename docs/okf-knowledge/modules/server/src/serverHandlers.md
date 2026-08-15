---
type: TypeScript Module
title: serverHandlers
resource: server/src/serverHandlers.ts#L1-L161
generated:
  by: okf-rs/0.4.0
relationships:
  imports:
  - target: external/vscode-languageserver-node
    resolved_by: tree-sitter
    confidence: exact
  - target: external/fs
    resolved_by: tree-sitter
    confidence: exact
  - target: external/path
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-textutils
    resolved_by: tree-sitter
    confidence: exact
  member_of:
  - target: packages/server
    resolved_by: tree-sitter
    confidence: exact
---

# Contains

- [ClientCapabilities](../../../interfaces/server/src/serverHandlers/ClientCapabilities.md)
- [detectClientCapabilities](../../../functions/server/src/serverHandlers/detectClientCapabilities.md)
- [extractWorkspaceFolderPaths](../../../functions/server/src/serverHandlers/extractWorkspaceFolderPaths.md)
- [buildInitializeResult](../../../functions/server/src/serverHandlers/buildInitializeResult.md)
- [isMapFile](../../../functions/server/src/serverHandlers/isMapFile.md)
- [ClassifiedFileChange](../../../interfaces/server/src/serverHandlers/ClassifiedFileChange.md)
- [FileChangeClassification](../../../interfaces/server/src/serverHandlers/FileChangeClassification.md)
- [classifyWatchedFileChanges](../../../functions/server/src/serverHandlers/classifyWatchedFileChanges.md)

# Imports

- `vscode-languageserver/node`
- `fs`
- `path`
- `./utils/textUtils`

# Member of

- [ditacraft-lsp-server](../../../packages/server.md)