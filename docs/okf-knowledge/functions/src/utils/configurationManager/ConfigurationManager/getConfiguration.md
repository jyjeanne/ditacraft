---
type: TypeScript Method
title: getConfiguration
resource: src/utils/configurationManager.ts#L300-L308
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/server/src/settings/getDocumentSettings
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/fileCreationCommands/getTemplateContext
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/publishProfilesCommand/getPublishingProfiles
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/publishProfilesCommand/savePublishingProfiles
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/publishProfilesCommand/getLastUsedProfileName
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/publishProfilesCommand/rememberLastUsedProfile
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/validateGuideCommand/validateGuidePrerequisites
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/watchModeCommand/resolveWatchTarget
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/extension/registerRootMapFeature
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/extension/sendInitialRootMapSetting
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/extension/buildLLMConfig
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/extension/suggestCSpellSetup
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/languageClient/startLanguageClient
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/llm/metricsCollector/MetricsCollector/record
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/aiCompletionProvider/AICompletionProvider/provideCompletionItems
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/aiQuickFixProvider/AIQuickFixProvider/provideCodeActions
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditavalDecorationProvider/exceedsLargeFileThreshold
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/previewPanel/DitaPreviewPanel/_handleSetTheme
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/configurationManager/ConfigurationManager/loadConfiguration
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/configurationManager/ConfigurationManager/get
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/ditaOtWrapper/DitaOtWrapper/configureOtPath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/logger/Logger/loadConfiguration
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`public getConfiguration(): DitaCraftConfiguration`

# Called by

- [getDocumentSettings](../../../../../functions/server/src/settings/getDocumentSettings.md)
- [getTemplateContext](../../../../../functions/src/commands/fileCreationCommands/getTemplateContext.md)
- [getPublishingProfiles](../../../../../functions/src/commands/publishProfilesCommand/getPublishingProfiles.md)
- [savePublishingProfiles](../../../../../functions/src/commands/publishProfilesCommand/savePublishingProfiles.md)
- [getLastUsedProfileName](../../../../../functions/src/commands/publishProfilesCommand/getLastUsedProfileName.md)
- [rememberLastUsedProfile](../../../../../functions/src/commands/publishProfilesCommand/rememberLastUsedProfile.md)
- [validateGuidePrerequisites](../../../../../functions/src/commands/validateGuideCommand/validateGuidePrerequisites.md)
- [resolveWatchTarget](../../../../../functions/src/commands/watchModeCommand/resolveWatchTarget.md)
- [registerRootMapFeature](../../../../../functions/src/extension/registerRootMapFeature.md)
- [sendInitialRootMapSetting](../../../../../functions/src/extension/sendInitialRootMapSetting.md)
- [buildLLMConfig](../../../../../functions/src/extension/buildLLMConfig.md)
- [suggestCSpellSetup](../../../../../functions/src/extension/suggestCSpellSetup.md)
- [startLanguageClient](../../../../../functions/src/languageClient/startLanguageClient.md)
- [record](../../../../../functions/src/llm/metricsCollector/MetricsCollector/record.md)
- [provideCompletionItems](../../../../../functions/src/providers/aiCompletionProvider/AICompletionProvider/provideCompletionItems.md)
- [provideCodeActions](../../../../../functions/src/providers/aiQuickFixProvider/AIQuickFixProvider/provideCodeActions.md)
- [exceedsLargeFileThreshold](../../../../../functions/src/providers/ditavalDecorationProvider/exceedsLargeFileThreshold.md)
- [_handleSetTheme](../../../../../functions/src/providers/previewPanel/DitaPreviewPanel/_handleSetTheme.md)
- [loadConfiguration](../../../../../functions/src/utils/configurationManager/ConfigurationManager/loadConfiguration.md)
- [get](../../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)
- [configureOtPath](../../../../../functions/src/utils/ditaOtWrapper/DitaOtWrapper/configureOtPath.md)
- [loadConfiguration](../../../../../functions/src/utils/logger/Logger/loadConfiguration.md)