---
type: TypeScript Module
title: circularRefDetection
resource: server/src/features/circularRefDetection.ts#L1-L236
generated:
  by: okf-rs/0.4.0
relationships:
  imports:
  - target: external/vscode-languageserver-node
    resolved_by: tree-sitter
    confidence: exact
  - target: external/path
    resolved_by: tree-sitter
    confidence: exact
  - target: external/fs
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-i18n
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

- [detectCircularReferences](../../../../functions/server/src/features/circularRefDetection/detectCircularReferences.md)
- [FileRef](../../../../interfaces/server/src/features/circularRefDetection/FileRef.md)
- [extractFileReferences](../../../../functions/server/src/features/circularRefDetection/extractFileReferences.md)
- [resolveRef](../../../../functions/server/src/features/circularRefDetection/resolveRef.md)
- [dfsDetectAnyCycle](../../../../functions/server/src/features/circularRefDetection/dfsDetectAnyCycle.md)
- [canonicalizeCycle](../../../../functions/server/src/features/circularRefDetection/canonicalizeCycle.md)
- [isDitaFile](../../../../functions/server/src/features/circularRefDetection/isDitaFile.md)
- [normalizePath](../../../../functions/server/src/features/circularRefDetection/normalizePath.md)

# Imports

- `vscode-languageserver/node`
- `path`
- `fs`
- `../utils/i18n`
- `../utils/textUtils`

# Member of

- [ditacraft-lsp-server](../../../../packages/server.md)