---
type: TypeScript Function
title: processFile
resource: server/src/features/batchMetadata.ts#L161-L219
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/utils/textUtils/uriToPath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/configurationManager/ConfigurationManager/get
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/batchMetadata/findRootElement
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/keySpaceService/KeySpaceService/getSubjectSchemePaths
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/subjectSchemeService/SubjectSchemeService/snapshotFor
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/batchMetadata/validateAgainstSubjectScheme
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/batchMetadata/buildAttributeEdit
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/batchMetadata/handleComputeBatchMetadataEdits
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function processFile( fileUri: string, documents: TextDocuments<TextDocument>, subjectSchemeService: SubjectSchemeService, keySpaceService: KeySpaceService | undefined, attribute: string, value: string ): Promise<FileOutcome>`

# Calls

- [uriToPath](../../../../../functions/server/src/utils/textUtils/uriToPath.md)
- [get](../../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)
- [findRootElement](../../../../../functions/server/src/features/batchMetadata/findRootElement.md)
- [getSubjectSchemePaths](../../../../../functions/server/src/services/keySpaceService/KeySpaceService/getSubjectSchemePaths.md)
- [snapshotFor](../../../../../functions/server/src/services/subjectSchemeService/SubjectSchemeService/snapshotFor.md)
- [validateAgainstSubjectScheme](../../../../../functions/server/src/features/batchMetadata/validateAgainstSubjectScheme.md)
- [buildAttributeEdit](../../../../../functions/server/src/features/batchMetadata/buildAttributeEdit.md)

# Called by

- [handleComputeBatchMetadataEdits](../../../../../functions/server/src/features/batchMetadata/handleComputeBatchMetadataEdits.md)