/**
 * Command Handlers Index
 * Central export point for all DitaCraft commands
 */

export {
    validateCommand,
    initializeValidator,
    getValidationRateLimiter,
    resetValidationRateLimiter
} from './validateCommand';
export { publishCommand, publishHTML5Command } from './publishCommand';
export {
    managePublishingProfilesCommand,
    getPublishingProfiles,
    getLastUsedProfileName,
    rememberLastUsedProfile,
    resolveDitavalPath,
    followDitavalMoves,
} from './publishProfilesCommand';
export type { PublishingProfile } from './publishProfilesCommand';
export { previewHTML5Command, previewDitaOtCommand, initializePreview, shouldAutoRefreshPreview, pickPreviewFilterCommand, requestPreviewRefresh, isPreviewRefreshInFlight, getActiveDitavalPath, onDidChangeActiveDitaval, followActiveDitavalMove } from './previewCommand';
export { newTopicCommand, newMapCommand, newBookmapCommand, initProjectCommand } from './fileCreationCommands';
export { configureDitaOTCommand } from './configureCommand';
export { setupCSpellCommand } from './cspellSetupCommand';
export { validateGuideCommand } from './validateGuideCommand';
export { configureAICommand } from './configureAICommand';
export { restructureMapCommand } from './restructureMapCommand';
export { insertImageCommand } from './insertImageCommand';
export { insertTableCommand } from './insertTableCommand';
export { findReplaceInFilesCommand } from './findReplaceCommand';
export { batchUpdateMetadataCommand } from './batchMetadataCommand';
export { editDitavalConditionsCommand } from './ditavalConditionEditorCommand';
export { extractTopicFromSectionCommand, buildExtractedTopicContent, detectNewTopicType, slugify } from './extractTopicCommand';
export {
    startWatchModeCommand,
    stopWatchModeCommand,
    disposeWatchMode,
    isWatchModeActive,
    resolveWatchTarget,
    resolveWatchPublishOptions,
} from './watchModeCommand';
export { inlineConrefCommand } from './inlineConrefCommand';
