---
type: TypeScript Module
title: documentLinks
resource: server/src/features/documentLinks.ts#L1-L251
generated:
  by: okf-rs/0.4.0
relationships:
  imports:
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

- [LinkData](../../../../interfaces/server/src/features/documentLinks/LinkData.md)
- [handleDocumentLinks](../../../../functions/server/src/features/documentLinks/handleDocumentLinks.md)
- [handleDocumentLinkResolve](../../../../functions/server/src/features/documentLinks/handleDocumentLinkResolve.md)
- [getCommentRanges](../../../../functions/server/src/features/documentLinks/getCommentRanges.md)
- [isInsideComment](../../../../functions/server/src/features/documentLinks/isInsideComment.md)
- [shouldSkip](../../../../functions/server/src/features/documentLinks/shouldSkip.md)
- [getValueStartOffset](../../../../functions/server/src/features/documentLinks/getValueStartOffset.md)
- [processFileRefs](../../../../functions/server/src/features/documentLinks/processFileRefs.md)
- [processKeyRefs](../../../../functions/server/src/features/documentLinks/processKeyRefs.md)

# Imports

- `path`
- `vscode-languageserver/node`
- `vscode-languageserver-textdocument`
- `vscode-uri`
- `../services/keySpaceService`
- `../utils/textUtils`

# Member of

- [ditacraft-lsp-server](../../../../packages/server.md)