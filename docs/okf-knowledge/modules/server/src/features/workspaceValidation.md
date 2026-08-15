---
type: TypeScript Module
title: workspaceValidation
resource: server/src/features/workspaceValidation.ts#L1-L292
generated:
  by: okf-rs/0.4.0
relationships:
  imports:
  - target: external/path
    resolved_by: tree-sitter
    confidence: exact
  - target: external/fs
    resolved_by: tree-sitter
    confidence: exact
  - target: external/vscode-languageserver-node
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-i18n
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-workspacescanner
    resolved_by: tree-sitter
    confidence: exact
  - target: external/services-keyspaceservice
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

- [extractRootId](../../../../functions/server/src/features/workspaceValidation/extractRootId.md)
- [mapWithConcurrency](../../../../functions/server/src/features/workspaceValidation/mapWithConcurrency.md)
- [worker](../../../../functions/server/src/features/workspaceValidation/worker.md)
- [detectCrossFileDuplicateIds](../../../../functions/server/src/features/workspaceValidation/detectCrossFileDuplicateIds.md)
- [detectUnusedTopics](../../../../functions/server/src/features/workspaceValidation/detectUnusedTopics.md)
- [WorkspaceIndex](../../../../classes/server/src/features/workspaceValidation/WorkspaceIndex.md)
- [rootIdIndex](../../../../functions/server/src/features/workspaceValidation/WorkspaceIndex/rootIdIndex.md)
- [initialized](../../../../functions/server/src/features/workspaceValidation/WorkspaceIndex/initialized.md)
- [buildFull](../../../../functions/server/src/features/workspaceValidation/WorkspaceIndex/buildFull.md)
- [updateFile](../../../../functions/server/src/features/workspaceValidation/WorkspaceIndex/updateFile.md)
- [removeFile](../../../../functions/server/src/features/workspaceValidation/WorkspaceIndex/removeFile.md)
- [clear](../../../../functions/server/src/features/workspaceValidation/WorkspaceIndex/clear.md)
- [indexFile](../../../../functions/server/src/features/workspaceValidation/WorkspaceIndex/indexFile.md)
- [createUnusedTopicDiagnostic](../../../../functions/server/src/features/workspaceValidation/createUnusedTopicDiagnostic.md)

# Imports

- `path`
- `fs`
- `vscode-languageserver/node`
- `../utils/i18n`
- `../utils/workspaceScanner`
- `../services/keySpaceService`
- `../utils/textUtils`

# Member of

- [ditacraft-lsp-server](../../../../packages/server.md)