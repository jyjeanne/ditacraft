---
type: TypeScript Function
title: handleComputeBatchMetadataEdits
resource: server/src/features/batchMetadata.ts#L221-L268
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/features/workspaceValidation/mapWithConcurrency
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/batchMetadata/processFile
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function handleComputeBatchMetadataEdits( params: BatchMetadataParams, documents: TextDocuments<TextDocument>, subjectSchemeService: SubjectSchemeService, keySpaceService?: KeySpaceService ): Promise<BatchMetadataResult>`

# Calls

- [mapWithConcurrency](../../../../../functions/server/src/features/workspaceValidation/mapWithConcurrency.md)
- [processFile](../../../../../functions/server/src/features/batchMetadata/processFile.md)