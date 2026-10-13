---
type: TypeScript Function
title: isAiEnabled
resource: src/llm/aiEnabled.ts#L16-L18
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/utils/configurationManager/ConfigurationManager/getConfiguration
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/chat/ditacraftParticipant/handleRequest
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/configureAICommand/AiSettingsPanel/handle
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/configureAICommand/AiSettingsPanel/post
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/restructureMapCommand/restructureMapCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/extension/activate
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/llm/llmRouterService/LLMRouterService/activeProvider
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/aiCompletionProvider/AICompletionProvider/provideCompletionItems
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/aiQuickFixProvider/AIQuickFixProvider/provideCodeActions
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/aiQuickFixProvider/executeAiQuickFix
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function isAiEnabled(): boolean`

# Calls

- [getConfiguration](../../../../functions/src/utils/configurationManager/ConfigurationManager/getConfiguration.md)

# Called by

- [handleRequest](../../../../functions/src/chat/ditacraftParticipant/handleRequest.md)
- [handle](../../../../functions/src/commands/configureAICommand/AiSettingsPanel/handle.md)
- [post](../../../../functions/src/commands/configureAICommand/AiSettingsPanel/post.md)
- [restructureMapCommand](../../../../functions/src/commands/restructureMapCommand/restructureMapCommand.md)
- [activate](../../../../functions/src/extension/activate.md)
- [activeProvider](../../../../functions/src/llm/llmRouterService/LLMRouterService/activeProvider.md)
- [provideCompletionItems](../../../../functions/src/providers/aiCompletionProvider/AICompletionProvider/provideCompletionItems.md)
- [provideCodeActions](../../../../functions/src/providers/aiQuickFixProvider/AIQuickFixProvider/provideCodeActions.md)
- [executeAiQuickFix](../../../../functions/src/providers/aiQuickFixProvider/executeAiQuickFix.md)