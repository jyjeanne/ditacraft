---
type: TypeScript Module
title: extension
resource: src/extension.ts#L1-L1254
generated:
  by: okf-rs/0.4.0
relationships:
  imports:
  - target: external/vscode
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-ditaotwrapper
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-logger
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-errorutils
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-configurationmanager
    resolved_by: tree-sitter
    confidence: exact
  - target: external/providers-ditalinkprovider
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-elementnavigator
    resolved_by: tree-sitter
    confidence: exact
  - target: external/commands
    resolved_by: tree-sitter
    confidence: exact
  - target: external/providers-previewpanel
    resolved_by: tree-sitter
    confidence: exact
  - target: external/providers-ditavaldecorationprovider
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-ditaoterrorparser
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-constants
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-ditaotoutputchannel
    resolved_by: tree-sitter
    confidence: exact
  - target: external/providers-mapvisualizerpanel
    resolved_by: tree-sitter
    confidence: exact
  - target: external/providers-validationreportpanel
    resolved_by: tree-sitter
    confidence: exact
  - target: external/providers-ditavalconditioneditorpanel
    resolved_by: tree-sitter
    confidence: exact
  - target: external/providers-ditaexplorerprovider
    resolved_by: tree-sitter
    confidence: exact
  - target: external/providers-ditafiledecorationprovider
    resolved_by: tree-sitter
    confidence: exact
  - target: external/providers-keyspaceviewprovider
    resolved_by: tree-sitter
    confidence: exact
  - target: external/providers-diagnosticsviewprovider
    resolved_by: tree-sitter
    confidence: exact
  - target: external/languageclient
    resolved_by: tree-sitter
    confidence: exact
  - target: external/llm
    resolved_by: tree-sitter
    confidence: exact
  - target: external/chat-ditacraftparticipant
    resolved_by: tree-sitter
    confidence: exact
  - target: external/providers-aiquickfixprovider
    resolved_by: tree-sitter
    confidence: exact
  - target: external/providers-aicompletionprovider
    resolved_by: tree-sitter
    confidence: exact
  member_of:
  - target: packages/ditacraft
    resolved_by: tree-sitter
    confidence: exact
---

# Contains

- [activate](../../functions/src/extension/activate.md)
- [registerRootMapFeature](../../functions/src/extension/registerRootMapFeature.md)
- [updateRootMapStatusBar](../../functions/src/extension/updateRootMapStatusBar.md)
- [sendInitialRootMapSetting](../../functions/src/extension/sendInitialRootMapSetting.md)
- [buildLLMConfig](../../functions/src/extension/buildLLMConfig.md)
- [deactivate](../../functions/src/extension/deactivate.md)
- [LspTextEdit](../../interfaces/src/extension/LspTextEdit.md)
- [LspWorkspaceEdit](../../interfaces/src/extension/LspWorkspaceEdit.md)
- [registerMoveTopicFeature](../../functions/src/extension/registerMoveTopicFeature.md)
- [registerWatchModeFeature](../../functions/src/extension/registerWatchModeFeature.md)
- [registerPreviewAutoRefresh](../../functions/src/extension/registerPreviewAutoRefresh.md)
- [registerCommands](../../functions/src/extension/registerCommands.md)
- [registerLoggerCommands](../../functions/src/extension/registerLoggerCommands.md)
- [registerConfigurationListener](../../functions/src/extension/registerConfigurationListener.md)
- [handleConfigurationChange](../../functions/src/extension/handleConfigurationChange.md)
- [verifyDitaOtInstallation](../../functions/src/extension/verifyDitaOtInstallation.md)
- [showWelcomeMessage](../../functions/src/extension/showWelcomeMessage.md)
- [suggestCSpellSetup](../../functions/src/extension/suggestCSpellSetup.md)
- [getOutputChannel](../../functions/src/extension/getOutputChannel.md)
- [getDitaOtWrapper](../../functions/src/extension/getDitaOtWrapper.md)

# Imports

- `vscode`
- `./utils/ditaOtWrapper`
- `./utils/logger`
- `./utils/errorUtils`
- `./utils/configurationManager`
- `./providers/ditaLinkProvider`
- `./utils/elementNavigator`
- `./commands`
- `./providers/previewPanel`
- `./providers/ditavalDecorationProvider`
- `./utils/ditaOtErrorParser`
- `./utils/constants`
- `./utils/ditaOtOutputChannel`
- `./providers/mapVisualizerPanel`
- `./providers/validationReportPanel`
- `./providers/ditavalConditionEditorPanel`
- `./providers/ditaExplorerProvider`
- `./providers/ditaFileDecorationProvider`
- `./providers/keySpaceViewProvider`
- `./providers/diagnosticsViewProvider`
- `./languageClient`
- `./llm`
- `./chat/ditacraftParticipant`
- `./providers/aiQuickFixProvider`
- `./providers/aiCompletionProvider`

# Member of

- [ditacraft](../../packages/ditacraft.md)