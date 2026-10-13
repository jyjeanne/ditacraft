---
type: TypeScript Function
title: basename
resource: src/shared/render/toHtml.ts#L83-L85
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/mcp/src/resources/maps/readMapsResource
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/mcp/src/tools/ditaMapStructure/renderNode
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/circularRefDetection/detectCircularReferences
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/completion/getKeyrefCompletions
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/completion/getHrefFragmentCompletions
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/contextGraph/readTitle
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/contextGraph/buildMapNode
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/crossRefValidation/validateCrossReferences
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/documentLinks/processFileRefs
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/hover/getKeyrefHover
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/rename/resolveUsage
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/workspaceValidation/detectCrossFileDuplicateIds
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/keySpaceService/describeKeyTarget
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/keySpaceService/KeySpaceService/explainKey
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/keySpaceService/KeySpaceService/doBuildKeySpace
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/keySpaceService/reportKeySpace
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/keySpaceService/formatResolutionReport
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/test/rename/test/renameAt
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/batchMetadataCommand/summarizeSkipped
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/fileCreationCommands/runProjectInit
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/insertImageCommand/resolveImageHref
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/insertImageCommand/copyImageIntoDirectory
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/previewCommand/generateHtml5OutputIfNeeded
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/previewCommand/displayPreview
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/publishCommand/executePublish
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/validateCommand/validateCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/validateGuideCommand/executeValidation
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/watchModeCommand/startWatchModeCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/watchModeCommand/stopWatchModeCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/watchModeCommand/setWatchingStatus
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/watchModeCommand/runWatchPublish
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/imageFiles/pastedImageName
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/linkPicker/pickLinkTarget
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/linkTargets/pickItems
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/reusedContent/resolvedItems
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/reusedContent/mapRowItems
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/visualEditorProvider/EditorSession/sendInit
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/visualEditorProvider/EditorSession/refreshContext
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/ditaval/buildDitavalFilter
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/grammarRegistry/GrammarRegistry/fromExternalCatalog
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/grammarRegistry/labelOf
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/mapContext/placeLabel
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/mapContexts/MapContexts/pick
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/ReferenceResolver/titleOfFile
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/ReferenceResolver/resolveReuse
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/ReferenceResolver/resolveKeyref
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/ReferenceResolver/resolveHref
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/ReferenceResolver/resolveForeign
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/ReferenceResolver/resolveCode
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/updateTitle
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/renderNow
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/meta
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/contextMeta
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/properties/propertiesView/PropertiesViewProvider/refresh
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditaLinkProvider/DitaLinkProvider/processHrefAttributes
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditaLinkProvider/DitaLinkProvider/processConrefAttributes
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditaLinkProvider/DitaLinkProvider/processConkeyrefAttributesWithKeySpace
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditaLinkProvider/DitaLinkProvider/processKeyrefAttributesWithKeySpace
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditaLinkProvider/DitaLinkProvider/processXrefAttributes
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditaLinkProvider/DitaLinkProvider/processXrefKeyrefAttributes
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditaLinkProvider/DitaLinkProvider/processLinkAttributes
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditavalConditionEditorPanel/DitavalConditionEditorPanel/_updateTitle
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditavalConditionEditorPanel/DitavalConditionEditorPanel/_getHtmlContent
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/mapVisualizerPanel/MapVisualizerPanel/_updateTitle
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/previewPanel/DitaPreviewPanel/_update
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/grammar/buildGrammars/buildBundledGrammars
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/grammar/grammarCache/compileWithCache
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/shared/editorReused/test/resolve
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/keySpaceResolver/KeySpaceResolver/doBuildKeySpace
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/keySpaceResolver/KeySpaceResolver/resolveKeyInMap
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/keySpaceResolver/KeySpaceResolver/getCacheStats
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/mapHierarchyParser/parseReferences
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/mapHierarchyParser/parseMapHierarchy
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function basename(href: string): string`

# Called by

- [readMapsResource](../../../../../functions/mcp/src/resources/maps/readMapsResource.md)
- [renderNode](../../../../../functions/mcp/src/tools/ditaMapStructure/renderNode.md)
- [detectCircularReferences](../../../../../functions/server/src/features/circularRefDetection/detectCircularReferences.md)
- [getKeyrefCompletions](../../../../../functions/server/src/features/completion/getKeyrefCompletions.md)
- [getHrefFragmentCompletions](../../../../../functions/server/src/features/completion/getHrefFragmentCompletions.md)
- [readTitle](../../../../../functions/server/src/features/contextGraph/readTitle.md)
- [buildMapNode](../../../../../functions/server/src/features/contextGraph/buildMapNode.md)
- [validateCrossReferences](../../../../../functions/server/src/features/crossRefValidation/validateCrossReferences.md)
- [processFileRefs](../../../../../functions/server/src/features/documentLinks/processFileRefs.md)
- [getKeyrefHover](../../../../../functions/server/src/features/hover/getKeyrefHover.md)
- [resolveUsage](../../../../../functions/server/src/features/rename/resolveUsage.md)
- [detectCrossFileDuplicateIds](../../../../../functions/server/src/features/workspaceValidation/detectCrossFileDuplicateIds.md)
- [describeKeyTarget](../../../../../functions/server/src/services/keySpaceService/describeKeyTarget.md)
- [explainKey](../../../../../functions/server/src/services/keySpaceService/KeySpaceService/explainKey.md)
- [doBuildKeySpace](../../../../../functions/server/src/services/keySpaceService/KeySpaceService/doBuildKeySpace.md)
- [reportKeySpace](../../../../../functions/server/src/services/keySpaceService/reportKeySpace.md)
- [formatResolutionReport](../../../../../functions/server/src/services/keySpaceService/formatResolutionReport.md)
- [renameAt](../../../../../functions/server/test/rename/test/renameAt.md)
- [summarizeSkipped](../../../../../functions/src/commands/batchMetadataCommand/summarizeSkipped.md)
- [runProjectInit](../../../../../functions/src/commands/fileCreationCommands/runProjectInit.md)
- [resolveImageHref](../../../../../functions/src/commands/insertImageCommand/resolveImageHref.md)
- [copyImageIntoDirectory](../../../../../functions/src/commands/insertImageCommand/copyImageIntoDirectory.md)
- [generateHtml5OutputIfNeeded](../../../../../functions/src/commands/previewCommand/generateHtml5OutputIfNeeded.md)
- [displayPreview](../../../../../functions/src/commands/previewCommand/displayPreview.md)
- [executePublish](../../../../../functions/src/commands/publishCommand/executePublish.md)
- [validateCommand](../../../../../functions/src/commands/validateCommand/validateCommand.md)
- [executeValidation](../../../../../functions/src/commands/validateGuideCommand/executeValidation.md)
- [startWatchModeCommand](../../../../../functions/src/commands/watchModeCommand/startWatchModeCommand.md)
- [stopWatchModeCommand](../../../../../functions/src/commands/watchModeCommand/stopWatchModeCommand.md)
- [setWatchingStatus](../../../../../functions/src/commands/watchModeCommand/setWatchingStatus.md)
- [runWatchPublish](../../../../../functions/src/commands/watchModeCommand/runWatchPublish.md)
- [pastedImageName](../../../../../functions/src/editor/imageFiles/pastedImageName.md)
- [pickLinkTarget](../../../../../functions/src/editor/linkPicker/pickLinkTarget.md)
- [pickItems](../../../../../functions/src/editor/linkTargets/pickItems.md)
- [resolvedItems](../../../../../functions/src/editor/reusedContent/resolvedItems.md)
- [mapRowItems](../../../../../functions/src/editor/reusedContent/mapRowItems.md)
- [sendInit](../../../../../functions/src/editor/visualEditorProvider/EditorSession/sendInit.md)
- [refreshContext](../../../../../functions/src/editor/visualEditorProvider/EditorSession/refreshContext.md)
- [buildDitavalFilter](../../../../../functions/src/preview/ditaval/buildDitavalFilter.md)
- [fromExternalCatalog](../../../../../functions/src/preview/grammarRegistry/GrammarRegistry/fromExternalCatalog.md)
- [labelOf](../../../../../functions/src/preview/grammarRegistry/labelOf.md)
- [placeLabel](../../../../../functions/src/preview/mapContext/placeLabel.md)
- [pick](../../../../../functions/src/preview/mapContexts/MapContexts/pick.md)
- [titleOfFile](../../../../../functions/src/preview/resolver/ReferenceResolver/titleOfFile.md)
- [resolveReuse](../../../../../functions/src/preview/resolver/ReferenceResolver/resolveReuse.md)
- [resolveKeyref](../../../../../functions/src/preview/resolver/ReferenceResolver/resolveKeyref.md)
- [resolveHref](../../../../../functions/src/preview/resolver/ReferenceResolver/resolveHref.md)
- [resolveForeign](../../../../../functions/src/preview/resolver/ReferenceResolver/resolveForeign.md)
- [resolveCode](../../../../../functions/src/preview/resolver/ReferenceResolver/resolveCode.md)
- [updateTitle](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/updateTitle.md)
- [renderNow](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/renderNow.md)
- [meta](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/meta.md)
- [contextMeta](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/contextMeta.md)
- [refresh](../../../../../functions/src/properties/propertiesView/PropertiesViewProvider/refresh.md)
- [processHrefAttributes](../../../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/processHrefAttributes.md)
- [processConrefAttributes](../../../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/processConrefAttributes.md)
- [processConkeyrefAttributesWithKeySpace](../../../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/processConkeyrefAttributesWithKeySpace.md)
- [processKeyrefAttributesWithKeySpace](../../../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/processKeyrefAttributesWithKeySpace.md)
- [processXrefAttributes](../../../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/processXrefAttributes.md)
- [processXrefKeyrefAttributes](../../../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/processXrefKeyrefAttributes.md)
- [processLinkAttributes](../../../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/processLinkAttributes.md)
- [_updateTitle](../../../../../functions/src/providers/ditavalConditionEditorPanel/DitavalConditionEditorPanel/_updateTitle.md)
- [_getHtmlContent](../../../../../functions/src/providers/ditavalConditionEditorPanel/DitavalConditionEditorPanel/_getHtmlContent.md)
- [_updateTitle](../../../../../functions/src/providers/mapVisualizerPanel/MapVisualizerPanel/_updateTitle.md)
- [_update](../../../../../functions/src/providers/previewPanel/DitaPreviewPanel/_update.md)
- [buildBundledGrammars](../../../../../functions/src/shared/grammar/buildGrammars/buildBundledGrammars.md)
- [compileWithCache](../../../../../functions/src/shared/grammar/grammarCache/compileWithCache.md)
- [resolve](../../../../../functions/src/test/shared/editorReused/test/resolve.md)
- [doBuildKeySpace](../../../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/doBuildKeySpace.md)
- [resolveKeyInMap](../../../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/resolveKeyInMap.md)
- [getCacheStats](../../../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/getCacheStats.md)
- [parseReferences](../../../../../functions/src/utils/mapHierarchyParser/parseReferences.md)
- [parseMapHierarchy](../../../../../functions/src/utils/mapHierarchyParser/parseMapHierarchy.md)