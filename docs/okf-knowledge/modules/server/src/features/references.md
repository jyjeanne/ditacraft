---
type: TypeScript Module
title: references
resource: server/src/features/references.ts#L1-L111
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
  member_of:
  - target: packages/server
    resolved_by: tree-sitter
    confidence: exact
---

# Contains

- [handleReferences](../../../../functions/server/src/features/references/handleReferences.md)
- [filterMatchingRefs](../../../../functions/server/src/features/references/filterMatchingRefs.md)

# Imports

- `vscode-languageserver/node`
- `vscode-languageserver-textdocument`
- `../utils/referenceParser`
- `../utils/workspaceScanner`
- `../utils/textUtils`
- `../services/keySpaceService`

# Member of

- [ditacraft-lsp-server](../../../../packages/server.md)