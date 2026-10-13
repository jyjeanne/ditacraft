---
type: TypeScript Method
title: handle
resource: src/commands/configureAICommand.ts#L199-L264
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/mapView/RowDrag/find
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/llm/secretManager/SecretManager/storeApiKey
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/configureAICommand/AiSettingsPanel/redetect
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/llm/secretManager/SecretManager/deleteApiKey
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/llm/secretManager/SecretManager/getApiKeySource
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/configurationManager/ConfigurationManager/getConfiguration
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/llm/llmRouterService/LLMRouterService/testProvider
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/llm/aiEnabled/isAiEnabled
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/parse/Scanner/startsWith
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/errorUtils/getErrorMessage
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private async handle(msg: PageMessage): Promise<void>`

# Calls

- [find](../../../../../functions/webview/editor/mapView/RowDrag/find.md)
- [storeApiKey](../../../../../functions/src/llm/secretManager/SecretManager/storeApiKey.md)
- [redetect](../../../../../functions/src/commands/configureAICommand/AiSettingsPanel/redetect.md)
- [deleteApiKey](../../../../../functions/src/llm/secretManager/SecretManager/deleteApiKey.md)
- [getApiKeySource](../../../../../functions/src/llm/secretManager/SecretManager/getApiKeySource.md)
- [getConfiguration](../../../../../functions/src/utils/configurationManager/ConfigurationManager/getConfiguration.md)
- [testProvider](../../../../../functions/src/llm/llmRouterService/LLMRouterService/testProvider.md)
- [isAiEnabled](../../../../../functions/src/llm/aiEnabled/isAiEnabled.md)
- [startsWith](../../../../../functions/src/shared/cst/parse/Scanner/startsWith.md)
- [getErrorMessage](../../../../../functions/src/utils/errorUtils/getErrorMessage.md)