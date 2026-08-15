---
type: TypeScript Method
title: getApiKey
resource: src/llm/secretManager.ts#L20-L27
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/configurationManager/ConfigurationManager/get
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/extension/buildLLMConfig
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/llm/secretManager/SecretManager/hasApiKey
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async getApiKey(provider: string): Promise<string | undefined>`

# Calls

- [get](../../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)

# Called by

- [buildLLMConfig](../../../../../functions/src/extension/buildLLMConfig.md)
- [hasApiKey](../../../../../functions/src/llm/secretManager/SecretManager/hasApiKey.md)