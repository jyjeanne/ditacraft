---
type: TypeScript Function
title: buildLLMConfig
resource: src/extension.ts#L474-L490
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/configurationManager/ConfigurationManager/getConfiguration
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/llm/secretManager/SecretManager/getApiKey
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/configurationManager/ConfigurationManager/get
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/extension/activate
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function buildLLMConfig(sm: SecretManager): Promise<DitaCraftLLMConfig>`

# Calls

- [getConfiguration](../../../functions/src/utils/configurationManager/ConfigurationManager/getConfiguration.md)
- [getApiKey](../../../functions/src/llm/secretManager/SecretManager/getApiKey.md)
- [get](../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)

# Called by

- [activate](../../../functions/src/extension/activate.md)