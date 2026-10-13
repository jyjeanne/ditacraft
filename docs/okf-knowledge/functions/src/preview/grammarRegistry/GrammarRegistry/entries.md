---
type: TypeScript Method
title: entries
resource: src/preview/grammarRegistry.ts#L108-L118
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/server/src/services/keySpaceService/nodeText
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/keySpaceService/KeySpaceService/collectXmlElements
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/keySpaceService/KeySpaceService/cacheKeySpace
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/keySpaceService/KeySpaceService/cleanupExpiredCacheEntries
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/keySpaceService/KeySpaceService/cleanupExpiredRootMapCache
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/keySpaceService/KeySpaceService/doInvalidate
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/rngValidationService/RngValidationService/validateWithGrammar
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/validationPipeline/ValidationPipeline/evictOldest
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/validationPipeline/ValidationPipeline/runPipeline
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/test/inlineConref/test/inline
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/test/moveTopic/test/moveFiles
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/test/rename/test/project
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/test/rename/test/renameAt
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/findReplaceCommand/describeFileChanges
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/findReplaceCommand/buildWorkspaceEdit
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/visualEditorProvider/EditorSession/topicEdits
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/extension/registerMoveTopicFeature
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/conditionMarks/conditionMarks
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/ditaval/buildDitavalFilter
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/ditaval/decideValues
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/grammarRegistry/GrammarRegistry/select
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/grammarRegistry/GrammarRegistry/byPublicId
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/grammarRegistry/GrammarRegistry/fromExternalCatalog
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/contextExclusion
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditavalDecorationProvider/flagHover
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/commands/DitaCommands/inlineInsertableAt
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/contextMenu/groupByDomain
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/properties/propertiesOf
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/schema/buildEditorSchema
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/grammar/catalogShells/discoverShells
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/grammar/compiler/compileGrammar
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/grammar/compiler/expandAttrDefaults
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/grammar/schemaSpec/buildSchemaSpec
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/attrs
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/headerIds
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/shared/mapContext/test/maps
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/suite/configureAI/test/rows
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/configurationManager/ConfigurationManager/createConfigSnapshot
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/ditavalConditionState/mergeAttributeState
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/ditavalParser/isExcludedByRules
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/keySpaceResolver/KeySpaceResolver/invalidateCacheForFile
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/keySpaceResolver/KeySpaceResolver/cacheKeySpace
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/keySpaceResolver/KeySpaceResolver/cleanupExpiredCacheEntries
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/keySpaceResolver/KeySpaceResolver/cleanupExpiredRootMapCache
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/keySpaceResolver/KeySpaceResolver/getCacheStats
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/rateLimiter/RateLimiter/cleanup
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/clipboardSerializer
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/mapPlugin
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/properties/el
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private entries(): GrammarIndexEntry[]`

# Called by

- [nodeText](../../../../../functions/server/src/services/keySpaceService/nodeText.md)
- [collectXmlElements](../../../../../functions/server/src/services/keySpaceService/KeySpaceService/collectXmlElements.md)
- [cacheKeySpace](../../../../../functions/server/src/services/keySpaceService/KeySpaceService/cacheKeySpace.md)
- [cleanupExpiredCacheEntries](../../../../../functions/server/src/services/keySpaceService/KeySpaceService/cleanupExpiredCacheEntries.md)
- [cleanupExpiredRootMapCache](../../../../../functions/server/src/services/keySpaceService/KeySpaceService/cleanupExpiredRootMapCache.md)
- [doInvalidate](../../../../../functions/server/src/services/keySpaceService/KeySpaceService/doInvalidate.md)
- [validateWithGrammar](../../../../../functions/server/src/services/rngValidationService/RngValidationService/validateWithGrammar.md)
- [evictOldest](../../../../../functions/server/src/services/validationPipeline/ValidationPipeline/evictOldest.md)
- [runPipeline](../../../../../functions/server/src/services/validationPipeline/ValidationPipeline/runPipeline.md)
- [inline](../../../../../functions/server/test/inlineConref/test/inline.md)
- [moveFiles](../../../../../functions/server/test/moveTopic/test/moveFiles.md)
- [project](../../../../../functions/server/test/rename/test/project.md)
- [renameAt](../../../../../functions/server/test/rename/test/renameAt.md)
- [describeFileChanges](../../../../../functions/src/commands/findReplaceCommand/describeFileChanges.md)
- [buildWorkspaceEdit](../../../../../functions/src/commands/findReplaceCommand/buildWorkspaceEdit.md)
- [topicEdits](../../../../../functions/src/editor/visualEditorProvider/EditorSession/topicEdits.md)
- [registerMoveTopicFeature](../../../../../functions/src/extension/registerMoveTopicFeature.md)
- [conditionMarks](../../../../../functions/src/preview/conditionMarks/conditionMarks.md)
- [buildDitavalFilter](../../../../../functions/src/preview/ditaval/buildDitavalFilter.md)
- [decideValues](../../../../../functions/src/preview/ditaval/decideValues.md)
- [select](../../../../../functions/src/preview/grammarRegistry/GrammarRegistry/select.md)
- [byPublicId](../../../../../functions/src/preview/grammarRegistry/GrammarRegistry/byPublicId.md)
- [fromExternalCatalog](../../../../../functions/src/preview/grammarRegistry/GrammarRegistry/fromExternalCatalog.md)
- [contextExclusion](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/contextExclusion.md)
- [flagHover](../../../../../functions/src/providers/ditavalDecorationProvider/flagHover.md)
- [inlineInsertableAt](../../../../../functions/src/shared/editor/commands/DitaCommands/inlineInsertableAt.md)
- [groupByDomain](../../../../../functions/src/shared/editor/contextMenu/groupByDomain.md)
- [propertiesOf](../../../../../functions/src/shared/editor/properties/propertiesOf.md)
- [buildEditorSchema](../../../../../functions/src/shared/editor/schema/buildEditorSchema.md)
- [discoverShells](../../../../../functions/src/shared/grammar/catalogShells/discoverShells.md)
- [compileGrammar](../../../../../functions/src/shared/grammar/compiler/compileGrammar.md)
- [expandAttrDefaults](../../../../../functions/src/shared/grammar/compiler/expandAttrDefaults.md)
- [buildSchemaSpec](../../../../../functions/src/shared/grammar/schemaSpec/buildSchemaSpec.md)
- [attrs](../../../../../functions/src/shared/render/toHtml/Renderer/attrs.md)
- [headerIds](../../../../../functions/src/shared/render/toHtml/headerIds.md)
- [maps](../../../../../functions/src/test/shared/mapContext/test/maps.md)
- [rows](../../../../../functions/src/test/suite/configureAI/test/rows.md)
- [createConfigSnapshot](../../../../../functions/src/utils/configurationManager/ConfigurationManager/createConfigSnapshot.md)
- [mergeAttributeState](../../../../../functions/src/utils/ditavalConditionState/mergeAttributeState.md)
- [isExcludedByRules](../../../../../functions/src/utils/ditavalParser/isExcludedByRules.md)
- [invalidateCacheForFile](../../../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/invalidateCacheForFile.md)
- [cacheKeySpace](../../../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/cacheKeySpace.md)
- [cleanupExpiredCacheEntries](../../../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/cleanupExpiredCacheEntries.md)
- [cleanupExpiredRootMapCache](../../../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/cleanupExpiredRootMapCache.md)
- [getCacheStats](../../../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/getCacheStats.md)
- [cleanup](../../../../../functions/src/utils/rateLimiter/RateLimiter/cleanup.md)
- [clipboardSerializer](../../../../../functions/webview/editor/clipboardSerializer.md)
- [mapPlugin](../../../../../functions/webview/editor/mapView/mapPlugin.md)
- [el](../../../../../functions/webview/properties/el.md)