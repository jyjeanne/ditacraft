---
type: TypeScript Function
title: aiMode
resource: src/llm/llmConfig.ts#L12-L15
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/utils/configurationManager/ConfigurationManager/getConfiguration
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/llm/llmConfig/buildLLMConfig
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function aiMode(): DitaCraftLLMConfig['mode']`

# Calls

- [getConfiguration](../../../../functions/src/utils/configurationManager/ConfigurationManager/getConfiguration.md)

# Called by

- [buildLLMConfig](../../../../functions/src/llm/llmConfig/buildLLMConfig.md)