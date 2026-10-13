---
type: TypeScript Module
title: moveTopic
resource: server/src/features/moveTopic.ts#L1-L288
generated:
  by: okf-rs/0.7.0
relationships:
  imports:
  - target: external/fs-promises
    resolved_by: tree-sitter
    confidence: exact
  - target: external/path
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
  - target: external/workspacevalidation
    resolved_by: tree-sitter
    confidence: exact
  member_of:
  - target: packages/server
    resolved_by: tree-sitter
    confidence: exact
---

# Contains

- [FileMove](../../../../interfaces/server/src/features/moveTopic/FileMove.md)
- [ComputeMoveEditsParams](../../../../interfaces/server/src/features/moveTopic/ComputeMoveEditsParams.md)
- [isDitaFilePath](../../../../functions/server/src/features/moveTopic/isDitaFilePath.md)
- [toHrefPath](../../../../functions/server/src/features/moveTopic/toHrefPath.md)
- [FileReference](../../../../interfaces/server/src/features/moveTopic/FileReference.md)
- [relativeFileReferences](../../../../functions/server/src/features/moveTopic/relativeFileReferences.md)
- [resolveReference](../../../../functions/server/src/features/moveTopic/resolveReference.md)
- [referenceValue](../../../../functions/server/src/features/moveTopic/referenceValue.md)
- [isDirectory](../../../../functions/server/src/features/moveTopic/isDirectory.md)
- [readContent](../../../../functions/server/src/features/moveTopic/readContent.md)
- [handleComputeMoveEdits](../../../../functions/server/src/features/moveTopic/handleComputeMoveEdits.md)

# Imports

- `fs/promises`
- `path`
- `vscode-languageserver/node`
- `vscode-languageserver-textdocument`
- `vscode-uri`
- `../utils/workspaceScanner`
- `../utils/textUtils`
- `./workspaceValidation`

# Member of

- [ditacraft-lsp-server](../../../../packages/server.md)