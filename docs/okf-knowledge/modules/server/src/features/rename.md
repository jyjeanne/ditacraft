---
type: TypeScript Module
title: rename
resource: server/src/features/rename.ts#L1-L525
generated:
  by: okf-rs/0.4.0
relationships:
  imports:
  - target: external/fs-promises
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
  - target: external/utils-referenceparser
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-workspacescanner
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-textutils
    resolved_by: tree-sitter
    confidence: exact
  - target: external/services-keyspaceservice
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

- [handlePrepareRename](../../../../functions/server/src/features/rename/handlePrepareRename.md)
- [handleRename](../../../../functions/server/src/features/rename/handleRename.md)
- [collectCrossFileEdits](../../../../functions/server/src/features/rename/collectCrossFileEdits.md)
- [buildEditsForVerifiedRefs](../../../../functions/server/src/features/rename/buildEditsForVerifiedRefs.md)
- [collectMatchingEdits](../../../../functions/server/src/features/rename/collectMatchingEdits.md)
- [replaceIdInReference](../../../../functions/server/src/features/rename/replaceIdInReference.md)
- [handleKeyRename](../../../../functions/server/src/features/rename/handleKeyRename.md)
- [collectMatchingKeyEdits](../../../../functions/server/src/features/rename/collectMatchingKeyEdits.md)
- [sameKeyDefinition](../../../../functions/server/src/features/rename/sameKeyDefinition.md)
- [replaceKeyInReference](../../../../functions/server/src/features/rename/replaceKeyInReference.md)

# Imports

- `fs/promises`
- `vscode-languageserver/node`
- `vscode-languageserver-textdocument`
- `vscode-uri`
- `../utils/referenceParser`
- `../utils/workspaceScanner`
- `../utils/textUtils`
- `../services/keySpaceService`
- `./workspaceValidation`

# Member of

- [ditacraft-lsp-server](../../../../packages/server.md)