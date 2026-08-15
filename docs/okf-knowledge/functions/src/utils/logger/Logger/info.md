---
type: TypeScript Method
title: info
resource: src/utils/logger.ts#L189-L191
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/src/commands/batchMetadataCommand/batchUpdateMetadataCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/extractTopicCommand/extractTopicFromSectionCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/fileCreationCommands/createDitaFile
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/fileCreationCommands/runProjectInit
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/findReplaceCommand/findReplaceInFilesCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/inlineConrefCommand/inlineConrefCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/insertImageCommand/insertImageCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/insertTableCommand/insertTableCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/previewCommand/pickPreviewFilterCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/previewCommand/displayPreview
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/publishCommand/executePublish
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/publishProfilesCommand/managePublishingProfilesCommand
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
  - target: functions/src/commands/watchModeCommand/runWatchPublish
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/extension/activate
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/extension/registerRootMapFeature
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/extension/deactivate
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/extension/registerMoveTopicFeature
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/extension/registerWatchModeFeature
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/extension/registerCommands
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/extension/handleConfigurationChange
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/extension/verifyDitaOtInstallation
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/languageClient/startLanguageClient
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/languageClient/stopLanguageClient
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditaLinkProvider/registerDitaLinkProvider
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditavalConditionEditorPanel/DitavalConditionEditorPanel/createOrShow
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/mapVisualizerPanel/MapVisualizerPanel/createOrShow
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/ditaOtOutputChannel/DitaOtOutputChannel/logLine
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/ditaOtOutputChannel/DitaOtOutputChannel/logBuildStart
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/ditaOtOutputChannel/DitaOtOutputChannel/logBuildComplete
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/ditaOtWrapper/DitaOtWrapper/publish
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/elementNavigator/navigateToElement
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/elementNavigator/registerElementNavigationCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/keySpaceResolver/KeySpaceResolver/doBuildKeySpace
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/keySpaceResolver/KeySpaceResolver/cleanupExpiredCacheEntries
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/keySpaceResolver/KeySpaceResolver/clearCache
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/logger/Logger/constructor
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/logger/Logger/loadConfiguration
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/logger/Logger/reloadConfiguration
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/logger/Logger/clearOldLogs
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/logger/Logger/dispose
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/providerFactory/ProviderFactory/registerLinkProvider
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/providerFactory/ProviderFactory/dispose
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`public info(message: string, data?: unknown): void`

# Called by

- [batchUpdateMetadataCommand](../../../../../functions/src/commands/batchMetadataCommand/batchUpdateMetadataCommand.md)
- [extractTopicFromSectionCommand](../../../../../functions/src/commands/extractTopicCommand/extractTopicFromSectionCommand.md)
- [createDitaFile](../../../../../functions/src/commands/fileCreationCommands/createDitaFile.md)
- [runProjectInit](../../../../../functions/src/commands/fileCreationCommands/runProjectInit.md)
- [findReplaceInFilesCommand](../../../../../functions/src/commands/findReplaceCommand/findReplaceInFilesCommand.md)
- [inlineConrefCommand](../../../../../functions/src/commands/inlineConrefCommand/inlineConrefCommand.md)
- [insertImageCommand](../../../../../functions/src/commands/insertImageCommand/insertImageCommand.md)
- [insertTableCommand](../../../../../functions/src/commands/insertTableCommand/insertTableCommand.md)
- [pickPreviewFilterCommand](../../../../../functions/src/commands/previewCommand/pickPreviewFilterCommand.md)
- [displayPreview](../../../../../functions/src/commands/previewCommand/displayPreview.md)
- [executePublish](../../../../../functions/src/commands/publishCommand/executePublish.md)
- [managePublishingProfilesCommand](../../../../../functions/src/commands/publishProfilesCommand/managePublishingProfilesCommand.md)
- [executeValidation](../../../../../functions/src/commands/validateGuideCommand/executeValidation.md)
- [startWatchModeCommand](../../../../../functions/src/commands/watchModeCommand/startWatchModeCommand.md)
- [stopWatchModeCommand](../../../../../functions/src/commands/watchModeCommand/stopWatchModeCommand.md)
- [runWatchPublish](../../../../../functions/src/commands/watchModeCommand/runWatchPublish.md)
- [activate](../../../../../functions/src/extension/activate.md)
- [registerRootMapFeature](../../../../../functions/src/extension/registerRootMapFeature.md)
- [deactivate](../../../../../functions/src/extension/deactivate.md)
- [registerMoveTopicFeature](../../../../../functions/src/extension/registerMoveTopicFeature.md)
- [registerWatchModeFeature](../../../../../functions/src/extension/registerWatchModeFeature.md)
- [registerCommands](../../../../../functions/src/extension/registerCommands.md)
- [handleConfigurationChange](../../../../../functions/src/extension/handleConfigurationChange.md)
- [verifyDitaOtInstallation](../../../../../functions/src/extension/verifyDitaOtInstallation.md)
- [startLanguageClient](../../../../../functions/src/languageClient/startLanguageClient.md)
- [stopLanguageClient](../../../../../functions/src/languageClient/stopLanguageClient.md)
- [registerDitaLinkProvider](../../../../../functions/src/providers/ditaLinkProvider/registerDitaLinkProvider.md)
- [createOrShow](../../../../../functions/src/providers/ditavalConditionEditorPanel/DitavalConditionEditorPanel/createOrShow.md)
- [createOrShow](../../../../../functions/src/providers/mapVisualizerPanel/MapVisualizerPanel/createOrShow.md)
- [logLine](../../../../../functions/src/utils/ditaOtOutputChannel/DitaOtOutputChannel/logLine.md)
- [logBuildStart](../../../../../functions/src/utils/ditaOtOutputChannel/DitaOtOutputChannel/logBuildStart.md)
- [logBuildComplete](../../../../../functions/src/utils/ditaOtOutputChannel/DitaOtOutputChannel/logBuildComplete.md)
- [publish](../../../../../functions/src/utils/ditaOtWrapper/DitaOtWrapper/publish.md)
- [navigateToElement](../../../../../functions/src/utils/elementNavigator/navigateToElement.md)
- [registerElementNavigationCommand](../../../../../functions/src/utils/elementNavigator/registerElementNavigationCommand.md)
- [doBuildKeySpace](../../../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/doBuildKeySpace.md)
- [cleanupExpiredCacheEntries](../../../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/cleanupExpiredCacheEntries.md)
- [clearCache](../../../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/clearCache.md)
- [constructor](../../../../../functions/src/utils/logger/Logger/constructor.md)
- [loadConfiguration](../../../../../functions/src/utils/logger/Logger/loadConfiguration.md)
- [reloadConfiguration](../../../../../functions/src/utils/logger/Logger/reloadConfiguration.md)
- [clearOldLogs](../../../../../functions/src/utils/logger/Logger/clearOldLogs.md)
- [dispose](../../../../../functions/src/utils/logger/Logger/dispose.md)
- [registerLinkProvider](../../../../../functions/src/utils/providerFactory/ProviderFactory/registerLinkProvider.md)
- [dispose](../../../../../functions/src/utils/providerFactory/ProviderFactory/dispose.md)