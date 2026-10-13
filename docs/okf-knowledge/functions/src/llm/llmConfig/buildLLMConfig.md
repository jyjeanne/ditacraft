---
type: TypeScript Function
title: buildLLMConfig
resource: src/llm/llmConfig.ts#L17-L33
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/utils/configurationManager/ConfigurationManager/getConfiguration
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/llm/secretManager/SecretManager/getApiKey
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/llm/llmConfig/aiMode
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/commands/configureAICommand/AiSettingsPanel/redetect
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/configureAICommand/AiSettingsPanel/post
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/extension/activate
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function buildLLMConfig(sm: SecretManager): Promise<DitaCraftLLMConfig>`

# Calls

- [getConfiguration](../../../../functions/src/utils/configurationManager/ConfigurationManager/getConfiguration.md)
- [getApiKey](../../../../functions/src/llm/secretManager/SecretManager/getApiKey.md)
- [aiMode](../../../../functions/src/llm/llmConfig/aiMode.md)

# Called by

- [redetect](../../../../functions/src/commands/configureAICommand/AiSettingsPanel/redetect.md)
- [post](../../../../functions/src/commands/configureAICommand/AiSettingsPanel/post.md)
- [activate](../../../../functions/src/extension/activate.md)