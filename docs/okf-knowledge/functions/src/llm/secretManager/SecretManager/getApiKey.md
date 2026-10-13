---
type: TypeScript Method
title: getApiKey
resource: src/llm/secretManager.ts#L20-L27
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/llm/llmConfig/buildLLMConfig
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/llm/secretManager/SecretManager/hasApiKey
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async getApiKey(provider: string): Promise<string | undefined>`

# Called by

- [buildLLMConfig](../../../../../functions/src/llm/llmConfig/buildLLMConfig.md)
- [hasApiKey](../../../../../functions/src/llm/secretManager/SecretManager/hasApiKey.md)