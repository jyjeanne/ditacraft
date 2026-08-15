---
type: TypeScript Module
title: folding
resource: server/src/features/folding.ts#L1-L132
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
  - target: external/utils-tagstack
    resolved_by: tree-sitter
    confidence: exact
  member_of:
  - target: packages/server
    resolved_by: tree-sitter
    confidence: exact
---

# Contains

- [OpenTag](../../../../interfaces/server/src/features/folding/OpenTag.md)
- [handleFoldingRanges](../../../../functions/server/src/features/folding/handleFoldingRanges.md)
- [computeFoldingRanges](../../../../functions/server/src/features/folding/computeFoldingRanges.md)
- [buildLineOffsets](../../../../functions/server/src/features/folding/buildLineOffsets.md)
- [lineAtOffset](../../../../functions/server/src/features/folding/lineAtOffset.md)

# Imports

- `vscode-languageserver/node`
- `vscode-languageserver-textdocument`
- `../utils/tagStack`

# Member of

- [ditacraft-lsp-server](../../../../packages/server.md)