---
type: TypeScript Module
title: workspaceScanner
resource: server/src/utils/workspaceScanner.ts#L1-L202
generated:
  by: okf-rs/0.4.0
relationships:
  imports:
  - target: external/fs
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
  - target: external/referenceparser
    resolved_by: tree-sitter
    confidence: exact
  - target: external/textutils
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

- [collectDitaFiles](../../../../functions/server/src/utils/workspaceScanner/collectDitaFiles.md)
- [walk](../../../../functions/server/src/utils/workspaceScanner/walk.md)
- [collectDitaFilesAsync](../../../../functions/server/src/utils/workspaceScanner/collectDitaFilesAsync.md)
- [walk](../../../../functions/server/src/utils/workspaceScanner/walk-2.md)
- [referenceMatchesTarget](../../../../functions/server/src/utils/workspaceScanner/referenceMatchesTarget.md)
- [findCrossFileReferences](../../../../functions/server/src/utils/workspaceScanner/findCrossFileReferences.md)

# Imports

- `fs`
- `path`
- `vscode-languageserver/node`
- `vscode-languageserver-textdocument`
- `vscode-uri`
- `./referenceParser`
- `./textUtils`
- `../services/keySpaceService`

# Member of

- [ditacraft-lsp-server](../../../../packages/server.md)