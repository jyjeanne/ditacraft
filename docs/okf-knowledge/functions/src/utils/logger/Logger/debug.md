---
type: TypeScript Method
title: debug
resource: src/utils/logger.ts#L185-L187
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/src/commands/batchMetadataCommand/batchUpdateMetadataCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/fileCreationCommands/createDitaFile
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/fileCreationCommands/newTopicCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/fileCreationCommands/newMapCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/fileCreationCommands/newBookmapCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/fileCreationCommands/initProjectCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/findReplaceCommand/findReplaceInFilesCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/insertTableCommand/insertTableCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/previewCommand/getAndValidateFileUri
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/previewCommand/validateFilePath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/publishCommand/executePublish
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/publishProfilesCommand/pickTranstype
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/extension/registerPreviewAutoRefresh
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/extension/registerCommands
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/extension/registerLoggerCommands
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/extension/handleConfigurationChange
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/extension/verifyDitaOtInstallation
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditaLinkProvider/DitaLinkProvider/processConkeyrefAttributesWithKeySpace
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditaLinkProvider/DitaLinkProvider/processKeyrefAttributesWithKeySpace
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditaLinkProvider/DitaLinkProvider/processXrefKeyrefAttributes
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditavalDecorationProvider/recompute
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditavalDecorationProvider/scheduleRecompute
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/mapVisualizerPanel/MapVisualizerPanel/_openFile
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/previewPanel/DitaPreviewPanel/constructor
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/previewPanel/DitaPreviewPanel/_handleSetTheme
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/previewPanel/DitaPreviewPanel/_handleEditorScroll
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/previewPanel/DitaPreviewPanel/_handlePreviewScroll
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/previewPanel/DitaPreviewPanel/dispose
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/previewPanel/DitaPreviewPanel/_loadCustomCssAsync
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/ditaOtErrorParser/parseDitaOtOutput
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/ditaOtErrorParser/DitaOtDiagnostics/updateFromParsedOutput
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/ditaOtOutputChannel/DitaOtOutputChannel/logLine
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/ditaOtWrapper/DitaOtWrapper/verifyInstallation
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/ditaOtWrapper/DitaOtWrapper/publish
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/ditaOtWrapper/DitaOtWrapper/validateInputFile
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/elementNavigator/navigateToElement
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/keySpaceResolver/KeySpaceResolver/constructor
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/keySpaceResolver/KeySpaceResolver/setupPeriodicCleanup
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/keySpaceResolver/KeySpaceResolver/reloadCacheConfig
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/keySpaceResolver/KeySpaceResolver/setupFileWatcher
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/keySpaceResolver/KeySpaceResolver/queueInvalidation
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/keySpaceResolver/KeySpaceResolver/invalidateCacheForFile
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/keySpaceResolver/KeySpaceResolver/buildKeySpace
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/keySpaceResolver/KeySpaceResolver/doBuildKeySpace
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
  - target: functions/src/utils/keySpaceResolver/KeySpaceResolver/resolveKey
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/keySpaceResolver/KeySpaceResolver/findRootMap
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/keySpaceResolver/KeySpaceResolver/dispose
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/providerFactory/ProviderFactory/constructor
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/providerFactory/ProviderFactory/getKeySpaceResolver
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/providerFactory/ProviderFactory/getLinkProvider
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/providerFactory/ProviderFactory/dispose
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/rateLimiter/RateLimiter/isAllowed
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/rateLimiter/RateLimiter/cleanup
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`public debug(message: string, data?: unknown): void`

# Called by

- [batchUpdateMetadataCommand](../../../../../functions/src/commands/batchMetadataCommand/batchUpdateMetadataCommand.md)
- [createDitaFile](../../../../../functions/src/commands/fileCreationCommands/createDitaFile.md)
- [newTopicCommand](../../../../../functions/src/commands/fileCreationCommands/newTopicCommand.md)
- [newMapCommand](../../../../../functions/src/commands/fileCreationCommands/newMapCommand.md)
- [newBookmapCommand](../../../../../functions/src/commands/fileCreationCommands/newBookmapCommand.md)
- [initProjectCommand](../../../../../functions/src/commands/fileCreationCommands/initProjectCommand.md)
- [findReplaceInFilesCommand](../../../../../functions/src/commands/findReplaceCommand/findReplaceInFilesCommand.md)
- [insertTableCommand](../../../../../functions/src/commands/insertTableCommand/insertTableCommand.md)
- [getAndValidateFileUri](../../../../../functions/src/commands/previewCommand/getAndValidateFileUri.md)
- [validateFilePath](../../../../../functions/src/commands/previewCommand/validateFilePath.md)
- [executePublish](../../../../../functions/src/commands/publishCommand/executePublish.md)
- [pickTranstype](../../../../../functions/src/commands/publishProfilesCommand/pickTranstype.md)
- [registerPreviewAutoRefresh](../../../../../functions/src/extension/registerPreviewAutoRefresh.md)
- [registerCommands](../../../../../functions/src/extension/registerCommands.md)
- [registerLoggerCommands](../../../../../functions/src/extension/registerLoggerCommands.md)
- [handleConfigurationChange](../../../../../functions/src/extension/handleConfigurationChange.md)
- [verifyDitaOtInstallation](../../../../../functions/src/extension/verifyDitaOtInstallation.md)
- [processConkeyrefAttributesWithKeySpace](../../../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/processConkeyrefAttributesWithKeySpace.md)
- [processKeyrefAttributesWithKeySpace](../../../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/processKeyrefAttributesWithKeySpace.md)
- [processXrefKeyrefAttributes](../../../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/processXrefKeyrefAttributes.md)
- [recompute](../../../../../functions/src/providers/ditavalDecorationProvider/recompute.md)
- [scheduleRecompute](../../../../../functions/src/providers/ditavalDecorationProvider/scheduleRecompute.md)
- [_openFile](../../../../../functions/src/providers/mapVisualizerPanel/MapVisualizerPanel/_openFile.md)
- [constructor](../../../../../functions/src/providers/previewPanel/DitaPreviewPanel/constructor.md)
- [_handleSetTheme](../../../../../functions/src/providers/previewPanel/DitaPreviewPanel/_handleSetTheme.md)
- [_handleEditorScroll](../../../../../functions/src/providers/previewPanel/DitaPreviewPanel/_handleEditorScroll.md)
- [_handlePreviewScroll](../../../../../functions/src/providers/previewPanel/DitaPreviewPanel/_handlePreviewScroll.md)
- [dispose](../../../../../functions/src/providers/previewPanel/DitaPreviewPanel/dispose.md)
- [_loadCustomCssAsync](../../../../../functions/src/providers/previewPanel/DitaPreviewPanel/_loadCustomCssAsync.md)
- [parseDitaOtOutput](../../../../../functions/src/utils/ditaOtErrorParser/parseDitaOtOutput.md)
- [updateFromParsedOutput](../../../../../functions/src/utils/ditaOtErrorParser/DitaOtDiagnostics/updateFromParsedOutput.md)
- [logLine](../../../../../functions/src/utils/ditaOtOutputChannel/DitaOtOutputChannel/logLine.md)
- [verifyInstallation](../../../../../functions/src/utils/ditaOtWrapper/DitaOtWrapper/verifyInstallation.md)
- [publish](../../../../../functions/src/utils/ditaOtWrapper/DitaOtWrapper/publish.md)
- [validateInputFile](../../../../../functions/src/utils/ditaOtWrapper/DitaOtWrapper/validateInputFile.md)
- [navigateToElement](../../../../../functions/src/utils/elementNavigator/navigateToElement.md)
- [constructor](../../../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/constructor.md)
- [setupPeriodicCleanup](../../../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/setupPeriodicCleanup.md)
- [reloadCacheConfig](../../../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/reloadCacheConfig.md)
- [setupFileWatcher](../../../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/setupFileWatcher.md)
- [queueInvalidation](../../../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/queueInvalidation.md)
- [invalidateCacheForFile](../../../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/invalidateCacheForFile.md)
- [buildKeySpace](../../../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/buildKeySpace.md)
- [doBuildKeySpace](../../../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/doBuildKeySpace.md)
- [cacheKeySpace](../../../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/cacheKeySpace.md)
- [cleanupExpiredCacheEntries](../../../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/cleanupExpiredCacheEntries.md)
- [cleanupExpiredRootMapCache](../../../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/cleanupExpiredRootMapCache.md)
- [resolveKey](../../../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/resolveKey.md)
- [findRootMap](../../../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/findRootMap.md)
- [dispose](../../../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/dispose.md)
- [constructor](../../../../../functions/src/utils/providerFactory/ProviderFactory/constructor.md)
- [getKeySpaceResolver](../../../../../functions/src/utils/providerFactory/ProviderFactory/getKeySpaceResolver.md)
- [getLinkProvider](../../../../../functions/src/utils/providerFactory/ProviderFactory/getLinkProvider.md)
- [dispose](../../../../../functions/src/utils/providerFactory/ProviderFactory/dispose.md)
- [isAllowed](../../../../../functions/src/utils/rateLimiter/RateLimiter/isAllowed.md)
- [cleanup](../../../../../functions/src/utils/rateLimiter/RateLimiter/cleanup.md)