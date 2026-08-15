---
type: TypeScript Module
title: batchMetadata
resource: server/src/features/batchMetadata.ts#L1-L268
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
  - target: external/services-subjectschemeservice
    resolved_by: tree-sitter
    confidence: exact
  - target: external/services-keyspaceservice
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-textutils
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

- [BatchMetadataParams](../../../../interfaces/server/src/features/batchMetadata/BatchMetadataParams.md)
- [BatchMetadataSkippedFile](../../../../interfaces/server/src/features/batchMetadata/BatchMetadataSkippedFile.md)
- [BatchMetadataResult](../../../../interfaces/server/src/features/batchMetadata/BatchMetadataResult.md)
- [RootElementInfo](../../../../interfaces/server/src/features/batchMetadata/RootElementInfo.md)
- [findRootElement](../../../../functions/server/src/features/batchMetadata/findRootElement.md)
- [escapeXmlAttrValue](../../../../functions/server/src/features/batchMetadata/escapeXmlAttrValue.md)
- [buildAttributeEdit](../../../../functions/server/src/features/batchMetadata/buildAttributeEdit.md)
- [validateAgainstSubjectScheme](../../../../functions/server/src/features/batchMetadata/validateAgainstSubjectScheme.md)
- [FileOutcome](../../../../interfaces/server/src/features/batchMetadata/FileOutcome.md)
- [processFile](../../../../functions/server/src/features/batchMetadata/processFile.md)
- [handleComputeBatchMetadataEdits](../../../../functions/server/src/features/batchMetadata/handleComputeBatchMetadataEdits.md)

# Imports

- `fs/promises`
- `vscode-languageserver/node`
- `vscode-languageserver-textdocument`
- `../services/subjectSchemeService`
- `../services/keySpaceService`
- `../utils/textUtils`
- `./workspaceValidation`

# Member of

- [ditacraft-lsp-server](../../../../packages/server.md)