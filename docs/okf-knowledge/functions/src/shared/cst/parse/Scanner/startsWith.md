---
type: TypeScript Method
title: startsWith
resource: src/shared/cst/parse.ts#L54-L56
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/mcp/src/resources/maps/readMapsResource
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/mcp/src/utils/mapDiscovery/discoverRootMap
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/mcp/src/workspace/resolvePath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/mcp/src/workspace/validateWithinWorkspace
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/mcp/test/smoke-test/callAndParse
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/scripts/parity/compare-results/classifyFamily
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/scripts/screenshots/shoot/main
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/completion/findParentElement
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/completion/getHrefFileCompletions
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/contentModelValidation/parseElementTree
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/contextGraph/resolveHref
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/crossRefValidation/isPathInsideDir
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/documentLinks/shouldSkip
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/findReplace/searchableSpans
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/fragmentValidator/wrapFragment
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/hover/getHrefHover
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/inlineConref/rebaseReference
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/linkedEditing/findTagAtOffset
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/moveTopic/relativeFileReferences
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/moveTopic/handleComputeMoveEdits
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/validation/extractDoctypeInternalSubset
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/validation/extractBracketedSubset
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/keySpaceService/nodeText
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/keySpaceService/isWebAddress
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/keySpaceService/KeySpaceService/collectXmlElements
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/keySpaceService/KeySpaceService/extractKeyDefinitionsFromElements
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/keySpaceService/KeySpaceService/extractTopicReferences
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/keySpaceService/KeySpaceService/extractMapReferences
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/validationPipeline/ValidationPipeline/invalidateForDocument
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/ditaVersionDetector/detectDitaVersion
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/textUtils/findContainingWorkspaceFolder
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/workspaceScanner/walk
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/test/docsDataset/test/collectDitaFiles
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/configureAICommand/AiSettingsPanel/handle
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/publishProfilesCommand/storeDitavalPath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/linkPicker/candidateFiles
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/reuseCopy/rebase
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/llm/providers/anthropicProvider/AnthropicLLMProvider/isAvailable
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/llm/providers/openaiProvider/OpenAILLMProvider/isAvailable
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/grammarRegistry/GrammarRegistry/compileBundled
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/grammarRegistry/GrammarRegistry/fromExternalCatalog
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/grammarRegistry/GrammarRegistry/reset
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/mapContext/placeInfo
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/mapContexts/localMaps
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/paths/isInside
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditaLinkProvider/DitaLinkProvider/processHrefAttributes
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditaLinkProvider/DitaLinkProvider/processConrefAttributes
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditaLinkProvider/DitaLinkProvider/processXrefAttributes
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditaLinkProvider/DitaLinkProvider/processLinkAttributes
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditaLinkProvider/DitaLinkProvider/resolveReferenceWithFragment
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/previewPanel/DitaPreviewPanel/_convertLocalResourcesAsync
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/previewPanel/DitaPreviewPanel/_loadCustomCssAsync
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/parse/Scanner/parseNode
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/parse/Scanner/parsePi
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/images/droppedUris
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/properties/groupOf
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/properties/propertiesOf
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toProseMirror/decodeText
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toProseMirror/Builder/trimEdges
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toProseMirror/Builder/text
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/Writer/placed
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/grammar/buildGrammars/bundledVersionOf
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/grammar/classTokens/basePlacement
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/grammar/compiler/expandText
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/grammar/typesxmlAdapter/toRawGrammar
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/foreign/safeAttribute
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/html/decodeXmlText
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/footnoteTarget
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/shared/helpers/listFiles
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/suite/insertImageCommand/test/stubWorkspaceFolderCoveringFixtures
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/ditaOtErrorCodes/getModuleForCode
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/keySpaceResolver/KeySpaceResolver/isPathWithinWorkspace
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/keySpaceResolver/KeySpaceResolver/extractKeyDefinitions
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/keySpaceResolver/KeySpaceResolver/extractMapReferences
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/keySpaceResolver/KeySpaceResolver/extractTopicReferences
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/keyUsageScanner/scanKeyUsages
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/logger/Logger/clearOldLogs
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/movedPaths/movedPath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/movedPaths/pathSettingValue
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/pasteImages
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/dropImages
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/updateUi
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/debug
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/menu/ContextMenu/typeAhead
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/properties/el
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`startsWith(s: string): boolean`

# Called by

- [readMapsResource](../../../../../../functions/mcp/src/resources/maps/readMapsResource.md)
- [discoverRootMap](../../../../../../functions/mcp/src/utils/mapDiscovery/discoverRootMap.md)
- [resolvePath](../../../../../../functions/mcp/src/workspace/resolvePath.md)
- [validateWithinWorkspace](../../../../../../functions/mcp/src/workspace/validateWithinWorkspace.md)
- [callAndParse](../../../../../../functions/mcp/test/smoke-test/callAndParse.md)
- [classifyFamily](../../../../../../functions/scripts/parity/compare-results/classifyFamily.md)
- [main](../../../../../../functions/scripts/screenshots/shoot/main.md)
- [findParentElement](../../../../../../functions/server/src/features/completion/findParentElement.md)
- [getHrefFileCompletions](../../../../../../functions/server/src/features/completion/getHrefFileCompletions.md)
- [parseElementTree](../../../../../../functions/server/src/features/contentModelValidation/parseElementTree.md)
- [resolveHref](../../../../../../functions/server/src/features/contextGraph/resolveHref.md)
- [isPathInsideDir](../../../../../../functions/server/src/features/crossRefValidation/isPathInsideDir.md)
- [shouldSkip](../../../../../../functions/server/src/features/documentLinks/shouldSkip.md)
- [searchableSpans](../../../../../../functions/server/src/features/findReplace/searchableSpans.md)
- [wrapFragment](../../../../../../functions/server/src/features/fragmentValidator/wrapFragment.md)
- [getHrefHover](../../../../../../functions/server/src/features/hover/getHrefHover.md)
- [rebaseReference](../../../../../../functions/server/src/features/inlineConref/rebaseReference.md)
- [findTagAtOffset](../../../../../../functions/server/src/features/linkedEditing/findTagAtOffset.md)
- [relativeFileReferences](../../../../../../functions/server/src/features/moveTopic/relativeFileReferences.md)
- [handleComputeMoveEdits](../../../../../../functions/server/src/features/moveTopic/handleComputeMoveEdits.md)
- [extractDoctypeInternalSubset](../../../../../../functions/server/src/features/validation/extractDoctypeInternalSubset.md)
- [extractBracketedSubset](../../../../../../functions/server/src/features/validation/extractBracketedSubset.md)
- [nodeText](../../../../../../functions/server/src/services/keySpaceService/nodeText.md)
- [isWebAddress](../../../../../../functions/server/src/services/keySpaceService/isWebAddress.md)
- [collectXmlElements](../../../../../../functions/server/src/services/keySpaceService/KeySpaceService/collectXmlElements.md)
- [extractKeyDefinitionsFromElements](../../../../../../functions/server/src/services/keySpaceService/KeySpaceService/extractKeyDefinitionsFromElements.md)
- [extractTopicReferences](../../../../../../functions/server/src/services/keySpaceService/KeySpaceService/extractTopicReferences.md)
- [extractMapReferences](../../../../../../functions/server/src/services/keySpaceService/KeySpaceService/extractMapReferences.md)
- [invalidateForDocument](../../../../../../functions/server/src/services/validationPipeline/ValidationPipeline/invalidateForDocument.md)
- [detectDitaVersion](../../../../../../functions/server/src/utils/ditaVersionDetector/detectDitaVersion.md)
- [findContainingWorkspaceFolder](../../../../../../functions/server/src/utils/textUtils/findContainingWorkspaceFolder.md)
- [walk](../../../../../../functions/server/src/utils/workspaceScanner/walk.md)
- [collectDitaFiles](../../../../../../functions/server/test/docsDataset/test/collectDitaFiles.md)
- [handle](../../../../../../functions/src/commands/configureAICommand/AiSettingsPanel/handle.md)
- [storeDitavalPath](../../../../../../functions/src/commands/publishProfilesCommand/storeDitavalPath.md)
- [candidateFiles](../../../../../../functions/src/editor/linkPicker/candidateFiles.md)
- [rebase](../../../../../../functions/src/editor/reuseCopy/rebase.md)
- [isAvailable](../../../../../../functions/src/llm/providers/anthropicProvider/AnthropicLLMProvider/isAvailable.md)
- [isAvailable](../../../../../../functions/src/llm/providers/openaiProvider/OpenAILLMProvider/isAvailable.md)
- [compileBundled](../../../../../../functions/src/preview/grammarRegistry/GrammarRegistry/compileBundled.md)
- [fromExternalCatalog](../../../../../../functions/src/preview/grammarRegistry/GrammarRegistry/fromExternalCatalog.md)
- [reset](../../../../../../functions/src/preview/grammarRegistry/GrammarRegistry/reset.md)
- [placeInfo](../../../../../../functions/src/preview/mapContext/placeInfo.md)
- [localMaps](../../../../../../functions/src/preview/mapContexts/localMaps.md)
- [isInside](../../../../../../functions/src/preview/paths/isInside.md)
- [processHrefAttributes](../../../../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/processHrefAttributes.md)
- [processConrefAttributes](../../../../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/processConrefAttributes.md)
- [processXrefAttributes](../../../../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/processXrefAttributes.md)
- [processLinkAttributes](../../../../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/processLinkAttributes.md)
- [resolveReferenceWithFragment](../../../../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/resolveReferenceWithFragment.md)
- [_convertLocalResourcesAsync](../../../../../../functions/src/providers/previewPanel/DitaPreviewPanel/_convertLocalResourcesAsync.md)
- [_loadCustomCssAsync](../../../../../../functions/src/providers/previewPanel/DitaPreviewPanel/_loadCustomCssAsync.md)
- [parseNode](../../../../../../functions/src/shared/cst/parse/Scanner/parseNode.md)
- [parsePi](../../../../../../functions/src/shared/cst/parse/Scanner/parsePi.md)
- [droppedUris](../../../../../../functions/src/shared/editor/images/droppedUris.md)
- [groupOf](../../../../../../functions/src/shared/editor/properties/groupOf.md)
- [propertiesOf](../../../../../../functions/src/shared/editor/properties/propertiesOf.md)
- [decodeText](../../../../../../functions/src/shared/editor/toProseMirror/decodeText.md)
- [trimEdges](../../../../../../functions/src/shared/editor/toProseMirror/Builder/trimEdges.md)
- [text](../../../../../../functions/src/shared/editor/toProseMirror/Builder/text.md)
- [placed](../../../../../../functions/src/shared/editor/toSource/Writer/placed.md)
- [bundledVersionOf](../../../../../../functions/src/shared/grammar/buildGrammars/bundledVersionOf.md)
- [basePlacement](../../../../../../functions/src/shared/grammar/classTokens/basePlacement.md)
- [expandText](../../../../../../functions/src/shared/grammar/compiler/expandText.md)
- [toRawGrammar](../../../../../../functions/src/shared/grammar/typesxmlAdapter/toRawGrammar.md)
- [safeAttribute](../../../../../../functions/src/shared/render/foreign/safeAttribute.md)
- [decodeXmlText](../../../../../../functions/src/shared/render/html/decodeXmlText.md)
- [footnoteTarget](../../../../../../functions/src/shared/render/toHtml/Renderer/footnoteTarget.md)
- [listFiles](../../../../../../functions/src/test/shared/helpers/listFiles.md)
- [stubWorkspaceFolderCoveringFixtures](../../../../../../functions/src/test/suite/insertImageCommand/test/stubWorkspaceFolderCoveringFixtures.md)
- [getModuleForCode](../../../../../../functions/src/utils/ditaOtErrorCodes/getModuleForCode.md)
- [isPathWithinWorkspace](../../../../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/isPathWithinWorkspace.md)
- [extractKeyDefinitions](../../../../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/extractKeyDefinitions.md)
- [extractMapReferences](../../../../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/extractMapReferences.md)
- [extractTopicReferences](../../../../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/extractTopicReferences.md)
- [scanKeyUsages](../../../../../../functions/src/utils/keyUsageScanner/scanKeyUsages.md)
- [clearOldLogs](../../../../../../functions/src/utils/logger/Logger/clearOldLogs.md)
- [movedPath](../../../../../../functions/src/utils/movedPaths/movedPath.md)
- [pathSettingValue](../../../../../../functions/src/utils/movedPaths/pathSettingValue.md)
- [pasteImages](../../../../../../functions/webview/editor/pasteImages.md)
- [dropImages](../../../../../../functions/webview/editor/dropImages.md)
- [updateUi](../../../../../../functions/webview/editor/updateUi.md)
- [debug](../../../../../../functions/webview/editor/debug.md)
- [typeAhead](../../../../../../functions/webview/editor/menu/ContextMenu/typeAhead.md)
- [el](../../../../../../functions/webview/properties/el.md)