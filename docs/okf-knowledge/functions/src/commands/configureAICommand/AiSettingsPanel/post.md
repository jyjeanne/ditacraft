---
type: TypeScript Method
title: post
resource: src/commands/configureAICommand.ts#L266-L291
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/llm/llmConfig/buildLLMConfig
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/llm/llmRouterService/LLMRouterService/getProviderStatuses
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/llm/secretManager/SecretManager/getApiKeySource
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/llm/aiEnabled/isAiEnabled
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/configureAICommand/describeProviders
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private async post(): Promise<void>`

# Calls

- [buildLLMConfig](../../../../../functions/src/llm/llmConfig/buildLLMConfig.md)
- [getProviderStatuses](../../../../../functions/src/llm/llmRouterService/LLMRouterService/getProviderStatuses.md)
- [getApiKeySource](../../../../../functions/src/llm/secretManager/SecretManager/getApiKeySource.md)
- [isAiEnabled](../../../../../functions/src/llm/aiEnabled/isAiEnabled.md)
- [describeProviders](../../../../../functions/src/commands/configureAICommand/describeProviders.md)