---
type: TypeScript Module
title: ditaResolveReference
resource: mcp/src/tools/ditaResolveReference.ts#L1-L250
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
  - target: external/types
    resolved_by: tree-sitter
    confidence: exact
  - target: external/workspace
    resolved_by: tree-sitter
    confidence: exact
  - target: external/server-src-utils-referenceparser
    resolved_by: tree-sitter
    confidence: exact
  - target: external/server-src-utils-textutils
    resolved_by: tree-sitter
    confidence: exact
  - target: external/logger
    resolved_by: tree-sitter
    confidence: exact
  member_of:
  - target: packages/ditacraft
    resolved_by: tree-sitter
    confidence: exact
---

# Contains

- [DitaResolveReferenceArgs](../../../../interfaces/mcp/src/tools/ditaResolveReference/DitaResolveReferenceArgs.md)
- [ResolveReferenceResult](../../../../interfaces/mcp/src/tools/ditaResolveReference/ResolveReferenceResult.md)
- [handleDitaResolveReference](../../../../functions/mcp/src/tools/ditaResolveReference/handleDitaResolveReference.md)
- [resolveKeyref](../../../../functions/mcp/src/tools/ditaResolveReference/resolveKeyref.md)
- [resolveConkeyref](../../../../functions/mcp/src/tools/ditaResolveReference/resolveConkeyref.md)
- [resolveHrefOrConref](../../../../functions/mcp/src/tools/ditaResolveReference/resolveHrefOrConref.md)
- [extractTitle](../../../../functions/mcp/src/tools/ditaResolveReference/extractTitle.md)
- [detectTopicType](../../../../functions/mcp/src/tools/ditaResolveReference/detectTopicType.md)

# Imports

- `path`
- `fs`
- `../types`
- `../workspace`
- `../../../server/src/utils/referenceParser`
- `../../../server/src/utils/textUtils`
- `../logger`

# Member of

- [ditacraft](../../../../packages/ditacraft.md)