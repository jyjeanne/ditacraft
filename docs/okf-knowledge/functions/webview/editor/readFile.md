---
type: TypeScript Function
title: readFile
resource: webview/editor/main.ts#L1461-L1468
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/server/src/features/batchMetadata/processFile
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/circularRefDetection/dfsDetectAnyCycle
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/completion/getKeyrefCompletions
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/completion/getHrefFragmentCompletions
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/crossRefValidation/validateCrossReferences
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/findReplace/handleComputeFindReplaceEdits
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/hover/getConrefPreview
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/inlineConref/readDocOrFile
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/moveTopic/readContent
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/rename/openDocument
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/rename/collectCrossFileEdits
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/workspaceValidation/detectUnusedTopics
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/workspaceValidation/WorkspaceIndex/indexFile
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/keySpaceService/KeySpaceService/doBuildKeySpace
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/rngValidationService/RngValidationService/compileGrammar
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/cspellSetupCommand/setupCSpellCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/insertImageCommand/copyImageIntoDirectory
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/workspaceText/readWorkspaceText
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditavalDecorationProvider/loadActiveFilter
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/previewPanel/DitaPreviewPanel/_getHtmlForWebviewAsync
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/previewPanel/DitaPreviewPanel/_loadCustomCssAsync
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/keySpaceResolver/KeySpaceResolver/readFileAsync
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/keyUsageScanner/scanKeyUsages
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/mapHierarchyParser/parseReferences
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/mapHierarchyParser/parseMapHierarchy
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/templateEngine/loadTemplateRaw
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function readFile(file: File): Promise<{ data: string; mime: string; name: string }>`

# Called by

- [processFile](../../../functions/server/src/features/batchMetadata/processFile.md)
- [dfsDetectAnyCycle](../../../functions/server/src/features/circularRefDetection/dfsDetectAnyCycle.md)
- [getKeyrefCompletions](../../../functions/server/src/features/completion/getKeyrefCompletions.md)
- [getHrefFragmentCompletions](../../../functions/server/src/features/completion/getHrefFragmentCompletions.md)
- [validateCrossReferences](../../../functions/server/src/features/crossRefValidation/validateCrossReferences.md)
- [handleComputeFindReplaceEdits](../../../functions/server/src/features/findReplace/handleComputeFindReplaceEdits.md)
- [getConrefPreview](../../../functions/server/src/features/hover/getConrefPreview.md)
- [readDocOrFile](../../../functions/server/src/features/inlineConref/readDocOrFile.md)
- [readContent](../../../functions/server/src/features/moveTopic/readContent.md)
- [openDocument](../../../functions/server/src/features/rename/openDocument.md)
- [collectCrossFileEdits](../../../functions/server/src/features/rename/collectCrossFileEdits.md)
- [detectUnusedTopics](../../../functions/server/src/features/workspaceValidation/detectUnusedTopics.md)
- [indexFile](../../../functions/server/src/features/workspaceValidation/WorkspaceIndex/indexFile.md)
- [doBuildKeySpace](../../../functions/server/src/services/keySpaceService/KeySpaceService/doBuildKeySpace.md)
- [compileGrammar](../../../functions/server/src/services/rngValidationService/RngValidationService/compileGrammar.md)
- [setupCSpellCommand](../../../functions/src/commands/cspellSetupCommand/setupCSpellCommand.md)
- [copyImageIntoDirectory](../../../functions/src/commands/insertImageCommand/copyImageIntoDirectory.md)
- [readWorkspaceText](../../../functions/src/preview/workspaceText/readWorkspaceText.md)
- [loadActiveFilter](../../../functions/src/providers/ditavalDecorationProvider/loadActiveFilter.md)
- [_getHtmlForWebviewAsync](../../../functions/src/providers/previewPanel/DitaPreviewPanel/_getHtmlForWebviewAsync.md)
- [_loadCustomCssAsync](../../../functions/src/providers/previewPanel/DitaPreviewPanel/_loadCustomCssAsync.md)
- [readFileAsync](../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/readFileAsync.md)
- [scanKeyUsages](../../../functions/src/utils/keyUsageScanner/scanKeyUsages.md)
- [parseReferences](../../../functions/src/utils/mapHierarchyParser/parseReferences.md)
- [parseMapHierarchy](../../../functions/src/utils/mapHierarchyParser/parseMapHierarchy.md)
- [loadTemplateRaw](../../../functions/src/utils/templateEngine/loadTemplateRaw.md)