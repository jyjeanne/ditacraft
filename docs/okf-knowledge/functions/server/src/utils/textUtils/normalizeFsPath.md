---
type: TypeScript Function
title: normalizeFsPath
resource: server/src/utils/textUtils.ts#L112-L115
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/server/src/features/circularRefDetection/normalizePath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/crossRefValidation/validateCrossReferences
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/moveTopic/handleComputeMoveEdits
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/references/handleReferences
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/rename/handleRename
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/rename/handleKeyRename
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/rename/sameKeyDefinition
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/workspaceValidation/detectCrossFileDuplicateIds
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/workspaceValidation/detectUnusedTopics
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/workspaceValidation/WorkspaceIndex/removeFile
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/workspaceValidation/WorkspaceIndex/indexFile
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/keySpaceService/KeySpaceService/resolveKeyEntryWithScope
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/keySpaceService/KeySpaceService/explainKey
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/keySpaceService/KeySpaceService/isBuildStale
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/keySpaceService/KeySpaceService/doFindRootMap
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/keySpaceService/KeySpaceService/doBuildKeySpace
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/keySpaceService/KeySpaceService/extractTopicReferences
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/keySpaceService/KeySpaceService/doInvalidate
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/validationPipeline/ValidationPipeline/runPipeline
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/textUtils/findContainingWorkspaceFolder
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/workspaceScanner/referenceMatchesTarget
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/workspaceScanner/findCrossFileReferences
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function normalizeFsPath(filePath: string): string`

# Called by

- [normalizePath](../../../../../functions/server/src/features/circularRefDetection/normalizePath.md)
- [validateCrossReferences](../../../../../functions/server/src/features/crossRefValidation/validateCrossReferences.md)
- [handleComputeMoveEdits](../../../../../functions/server/src/features/moveTopic/handleComputeMoveEdits.md)
- [handleReferences](../../../../../functions/server/src/features/references/handleReferences.md)
- [handleRename](../../../../../functions/server/src/features/rename/handleRename.md)
- [handleKeyRename](../../../../../functions/server/src/features/rename/handleKeyRename.md)
- [sameKeyDefinition](../../../../../functions/server/src/features/rename/sameKeyDefinition.md)
- [detectCrossFileDuplicateIds](../../../../../functions/server/src/features/workspaceValidation/detectCrossFileDuplicateIds.md)
- [detectUnusedTopics](../../../../../functions/server/src/features/workspaceValidation/detectUnusedTopics.md)
- [removeFile](../../../../../functions/server/src/features/workspaceValidation/WorkspaceIndex/removeFile.md)
- [indexFile](../../../../../functions/server/src/features/workspaceValidation/WorkspaceIndex/indexFile.md)
- [resolveKeyEntryWithScope](../../../../../functions/server/src/services/keySpaceService/KeySpaceService/resolveKeyEntryWithScope.md)
- [explainKey](../../../../../functions/server/src/services/keySpaceService/KeySpaceService/explainKey.md)
- [isBuildStale](../../../../../functions/server/src/services/keySpaceService/KeySpaceService/isBuildStale.md)
- [doFindRootMap](../../../../../functions/server/src/services/keySpaceService/KeySpaceService/doFindRootMap.md)
- [doBuildKeySpace](../../../../../functions/server/src/services/keySpaceService/KeySpaceService/doBuildKeySpace.md)
- [extractTopicReferences](../../../../../functions/server/src/services/keySpaceService/KeySpaceService/extractTopicReferences.md)
- [doInvalidate](../../../../../functions/server/src/services/keySpaceService/KeySpaceService/doInvalidate.md)
- [runPipeline](../../../../../functions/server/src/services/validationPipeline/ValidationPipeline/runPipeline.md)
- [findContainingWorkspaceFolder](../../../../../functions/server/src/utils/textUtils/findContainingWorkspaceFolder.md)
- [referenceMatchesTarget](../../../../../functions/server/src/utils/workspaceScanner/referenceMatchesTarget.md)
- [findCrossFileReferences](../../../../../functions/server/src/utils/workspaceScanner/findCrossFileReferences.md)