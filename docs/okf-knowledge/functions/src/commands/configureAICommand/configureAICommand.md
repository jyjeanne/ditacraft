---
type: TypeScript Function
title: configureAICommand
resource: src/commands/configureAICommand.ts#L16-L63
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/llm/llmRouterService/LLMRouterService/getProviderStatuses
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/configureAICommand/buildSettingsHtml
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/llm/secretManager/SecretManager/storeApiKey
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/llm/secretManager/SecretManager/deleteApiKey
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/llm/llmRouterService/LLMRouterService/forceProvider
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/errorUtils/getErrorMessage
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/extension/activate
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function configureAICommand( context: vscode.ExtensionContext, router: LLMRouterService, secretManager: SecretManager ): Promise<void>`

# Calls

- [getProviderStatuses](../../../../functions/src/llm/llmRouterService/LLMRouterService/getProviderStatuses.md)
- [buildSettingsHtml](../../../../functions/src/commands/configureAICommand/buildSettingsHtml.md)
- [storeApiKey](../../../../functions/src/llm/secretManager/SecretManager/storeApiKey.md)
- [deleteApiKey](../../../../functions/src/llm/secretManager/SecretManager/deleteApiKey.md)
- [forceProvider](../../../../functions/src/llm/llmRouterService/LLMRouterService/forceProvider.md)
- [getErrorMessage](../../../../functions/src/utils/errorUtils/getErrorMessage.md)

# Called by

- [activate](../../../../functions/src/extension/activate.md)