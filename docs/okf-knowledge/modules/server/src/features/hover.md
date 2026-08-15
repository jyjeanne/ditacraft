---
type: TypeScript Module
title: hover
resource: server/src/features/hover.ts#L1-L314
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
  - target: external/path
    resolved_by: tree-sitter
    confidence: exact
  - target: external/fs-promises
    resolved_by: tree-sitter
    confidence: exact
  - target: external/data-ditaschema
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-referenceparser
    resolved_by: tree-sitter
    confidence: exact
  - target: external/services-keyspaceservice
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-elementextent
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

- [handleHover](../../../../functions/server/src/features/hover/handleHover.md)
- [getKeyrefHover](../../../../functions/server/src/features/hover/getKeyrefHover.md)
- [getHrefHover](../../../../functions/server/src/features/hover/getHrefHover.md)
- [getConrefPreview](../../../../functions/server/src/features/hover/getConrefPreview.md)
- [getWordAt](../../../../functions/server/src/features/hover/getWordAt.md)
- [isInsideTag](../../../../functions/server/src/features/hover/isInsideTag.md)

# Imports

- `vscode-languageserver/node`
- `vscode-languageserver-textdocument`
- `path`
- `fs/promises`
- `../data/ditaSchema`
- `../utils/referenceParser`
- `../services/keySpaceService`
- `../utils/elementExtent`
- `../utils/textUtils`

# Member of

- [ditacraft-lsp-server](../../../../packages/server.md)