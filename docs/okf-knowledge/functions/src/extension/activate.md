---
type: TypeScript Function
title: activate
resource: src/extension.ts#L87-L333
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/commands/validateCommand/initializeValidator
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/previewCommand/initializePreview
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/previewPanel/registerPreviewPanelSerializer
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/extension/registerPreviewAutoRefresh
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditavalDecorationProvider/registerConditionHighlighting
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/elementNavigator/registerElementNavigationCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/extension/registerCommands
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/extension/registerConfigurationListener
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/extension/registerLoggerCommands
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/diagnosticsViewProvider/DiagnosticsViewProvider/setGroupMode
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/extension/registerRootMapFeature
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/extension/registerMoveTopicFeature
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/extension/registerPathFollowing
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/extension/registerWatchModeFeature
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/languageClient/startLanguageClient
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/extension/sendInitialRootMapSetting
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/logger/Logger/clearOldLogs
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/llm/llmRouterService/LLMRouterService/setMetrics
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/llm/llmConfig/buildLLMConfig
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/llm/aiEnabled/isAiEnabled
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/errorUtils/fireAndForget
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/configureAICommand/configureAICommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/chat/ditacraftParticipant/createDitacraftParticipant
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/restructureMapCommand/restructureMapCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/aiQuickFixProvider/safeExecuteAiQuickFix
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/aiCompletionProvider/registerAICompletionProvider
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/extension/verifyDitaOtInstallation
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/extension/showWelcomeMessage
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/extension/suggestCSpellSetup
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function activate(context: vscode.ExtensionContext)`

# Calls

- [initializeValidator](../../../functions/src/commands/validateCommand/initializeValidator.md)
- [initializePreview](../../../functions/src/commands/previewCommand/initializePreview.md)
- [registerPreviewPanelSerializer](../../../functions/src/providers/previewPanel/registerPreviewPanelSerializer.md)
- [registerPreviewAutoRefresh](../../../functions/src/extension/registerPreviewAutoRefresh.md)
- [registerConditionHighlighting](../../../functions/src/providers/ditavalDecorationProvider/registerConditionHighlighting.md)
- [registerElementNavigationCommand](../../../functions/src/utils/elementNavigator/registerElementNavigationCommand.md)
- [registerCommands](../../../functions/src/extension/registerCommands.md)
- [registerConfigurationListener](../../../functions/src/extension/registerConfigurationListener.md)
- [registerLoggerCommands](../../../functions/src/extension/registerLoggerCommands.md)
- [setGroupMode](../../../functions/src/providers/diagnosticsViewProvider/DiagnosticsViewProvider/setGroupMode.md)
- [registerRootMapFeature](../../../functions/src/extension/registerRootMapFeature.md)
- [registerMoveTopicFeature](../../../functions/src/extension/registerMoveTopicFeature.md)
- [registerPathFollowing](../../../functions/src/extension/registerPathFollowing.md)
- [registerWatchModeFeature](../../../functions/src/extension/registerWatchModeFeature.md)
- [startLanguageClient](../../../functions/src/languageClient/startLanguageClient.md)
- [sendInitialRootMapSetting](../../../functions/src/extension/sendInitialRootMapSetting.md)
- [clearOldLogs](../../../functions/src/utils/logger/Logger/clearOldLogs.md)
- [setMetrics](../../../functions/src/llm/llmRouterService/LLMRouterService/setMetrics.md)
- [buildLLMConfig](../../../functions/src/llm/llmConfig/buildLLMConfig.md)
- [isAiEnabled](../../../functions/src/llm/aiEnabled/isAiEnabled.md)
- [fireAndForget](../../../functions/src/utils/errorUtils/fireAndForget.md)
- [configureAICommand](../../../functions/src/commands/configureAICommand/configureAICommand.md)
- [createDitacraftParticipant](../../../functions/src/chat/ditacraftParticipant/createDitacraftParticipant.md)
- [restructureMapCommand](../../../functions/src/commands/restructureMapCommand/restructureMapCommand.md)
- [safeExecuteAiQuickFix](../../../functions/src/providers/aiQuickFixProvider/safeExecuteAiQuickFix.md)
- [registerAICompletionProvider](../../../functions/src/providers/aiCompletionProvider/registerAICompletionProvider.md)
- [verifyDitaOtInstallation](../../../functions/src/extension/verifyDitaOtInstallation.md)
- [showWelcomeMessage](../../../functions/src/extension/showWelcomeMessage.md)
- [suggestCSpellSetup](../../../functions/src/extension/suggestCSpellSetup.md)