---
type: TypeScript Module
title: inlineConref
resource: server/src/features/inlineConref.ts#L1-L377
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
  - target: external/utils-textutils
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-referenceparser
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-elementextent
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

- [InlineConrefParams](../../../../interfaces/server/src/features/inlineConref/InlineConrefParams.md)
- [InlineConrefResult](../../../../interfaces/server/src/features/inlineConref/InlineConrefResult.md)
- [ConrefElement](../../../../interfaces/server/src/features/inlineConref/ConrefElement.md)
- [findConrefElementAtOffset](../../../../functions/server/src/features/inlineConref/findConrefElementAtOffset.md)
- [TagAttribute](../../../../interfaces/server/src/features/inlineConref/TagAttribute.md)
- [tagAttributes](../../../../functions/server/src/features/inlineConref/tagAttributes.md)
- [resolvedOpenTag](../../../../functions/server/src/features/inlineConref/resolvedOpenTag.md)
- [rebaseReference](../../../../functions/server/src/features/inlineConref/rebaseReference.md)
- [rebaseContentReferences](../../../../functions/server/src/features/inlineConref/rebaseContentReferences.md)
- [rootElementId](../../../../functions/server/src/features/inlineConref/rootElementId.md)
- [stripNestedIds](../../../../functions/server/src/features/inlineConref/stripNestedIds.md)
- [readDocOrFile](../../../../functions/server/src/features/inlineConref/readDocOrFile.md)
- [handleComputeInlineConrefEdit](../../../../functions/server/src/features/inlineConref/handleComputeInlineConrefEdit.md)

# Imports

- `fs/promises`
- `path`
- `vscode-languageserver/node`
- `vscode-languageserver-textdocument`
- `vscode-uri`
- `../utils/textUtils`
- `../utils/referenceParser`
- `../utils/elementExtent`
- `../services/keySpaceService`

# Member of

- [ditacraft-lsp-server](../../../../packages/server.md)