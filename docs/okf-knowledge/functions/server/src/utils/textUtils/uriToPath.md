---
type: TypeScript Function
title: uriToPath
resource: server/src/utils/textUtils.ts#L195-L197
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/server/src/features/batchMetadata/processFile
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/circularRefDetection/detectCircularReferences
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/completion/getAttributeValueCompletions
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/completion/getKeyrefCompletions
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/completion/getHrefFragmentCompletions
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/completion/getHrefFileCompletions
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/contextGraph/handleGetContextGraph
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/crossRefValidation/validateCrossReferences
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/definition/handleDefinition
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/ditavalConditions/handleGetSubjectSchemeAttributes
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/documentLinks/handleDocumentLinks
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/findReplace/handleComputeFindReplaceEdits
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/hover/handleHover
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/hover/getKeyrefHover
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/hover/getHrefHover
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/inlineConref/handleComputeInlineConrefEdit
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
  - target: functions/server/src/features/validation/getFileExtension
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/serverHandlers/extractWorkspaceFolderPaths
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/serverHandlers/classifyWatchedFileChanges
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/validationPipeline/ValidationPipeline/runPipeline
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function uriToPath(uri: string): string`

# Called by

- [processFile](../../../../../functions/server/src/features/batchMetadata/processFile.md)
- [detectCircularReferences](../../../../../functions/server/src/features/circularRefDetection/detectCircularReferences.md)
- [getAttributeValueCompletions](../../../../../functions/server/src/features/completion/getAttributeValueCompletions.md)
- [getKeyrefCompletions](../../../../../functions/server/src/features/completion/getKeyrefCompletions.md)
- [getHrefFragmentCompletions](../../../../../functions/server/src/features/completion/getHrefFragmentCompletions.md)
- [getHrefFileCompletions](../../../../../functions/server/src/features/completion/getHrefFileCompletions.md)
- [handleGetContextGraph](../../../../../functions/server/src/features/contextGraph/handleGetContextGraph.md)
- [validateCrossReferences](../../../../../functions/server/src/features/crossRefValidation/validateCrossReferences.md)
- [handleDefinition](../../../../../functions/server/src/features/definition/handleDefinition.md)
- [handleGetSubjectSchemeAttributes](../../../../../functions/server/src/features/ditavalConditions/handleGetSubjectSchemeAttributes.md)
- [handleDocumentLinks](../../../../../functions/server/src/features/documentLinks/handleDocumentLinks.md)
- [handleComputeFindReplaceEdits](../../../../../functions/server/src/features/findReplace/handleComputeFindReplaceEdits.md)
- [handleHover](../../../../../functions/server/src/features/hover/handleHover.md)
- [getKeyrefHover](../../../../../functions/server/src/features/hover/getKeyrefHover.md)
- [getHrefHover](../../../../../functions/server/src/features/hover/getHrefHover.md)
- [handleComputeInlineConrefEdit](../../../../../functions/server/src/features/inlineConref/handleComputeInlineConrefEdit.md)
- [handleComputeMoveEdits](../../../../../functions/server/src/features/moveTopic/handleComputeMoveEdits.md)
- [handleReferences](../../../../../functions/server/src/features/references/handleReferences.md)
- [handleRename](../../../../../functions/server/src/features/rename/handleRename.md)
- [handleKeyRename](../../../../../functions/server/src/features/rename/handleKeyRename.md)
- [getFileExtension](../../../../../functions/server/src/features/validation/getFileExtension.md)
- [extractWorkspaceFolderPaths](../../../../../functions/server/src/serverHandlers/extractWorkspaceFolderPaths.md)
- [classifyWatchedFileChanges](../../../../../functions/server/src/serverHandlers/classifyWatchedFileChanges.md)
- [runPipeline](../../../../../functions/server/src/services/validationPipeline/ValidationPipeline/runPipeline.md)