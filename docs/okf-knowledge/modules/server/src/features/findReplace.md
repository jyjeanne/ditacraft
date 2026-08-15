---
type: TypeScript Module
title: findReplace
resource: server/src/features/findReplace.ts#L1-L182
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
  - target: external/utils-workspacescanner
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-textutils
    resolved_by: tree-sitter
    confidence: exact
  - target: external/workspacevalidation
    resolved_by: tree-sitter
    confidence: exact
  - target: external/movetopic
    resolved_by: tree-sitter
    confidence: exact
  member_of:
  - target: packages/server
    resolved_by: tree-sitter
    confidence: exact
---

# Contains

- [FindReplaceParams](../../../../interfaces/server/src/features/findReplace/FindReplaceParams.md)
- [FindReplaceResult](../../../../interfaces/server/src/features/findReplace/FindReplaceResult.md)
- [buildSearchPattern](../../../../functions/server/src/features/findReplace/buildSearchPattern.md)
- [expandReplacement](../../../../functions/server/src/features/findReplace/expandReplacement.md)
- [handleComputeFindReplaceEdits](../../../../functions/server/src/features/findReplace/handleComputeFindReplaceEdits.md)

# Imports

- `fs/promises`
- `vscode-languageserver/node`
- `vscode-languageserver-textdocument`
- `vscode-uri`
- `../utils/workspaceScanner`
- `../utils/textUtils`
- `./workspaceValidation`
- `./moveTopic`

# Member of

- [ditacraft-lsp-server](../../../../packages/server.md)