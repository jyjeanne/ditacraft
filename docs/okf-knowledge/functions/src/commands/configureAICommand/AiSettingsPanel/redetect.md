---
type: TypeScript Method
title: redetect
resource: src/commands/configureAICommand.ts#L195-L197
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/llm/llmConfig/buildLLMConfig
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/commands/configureAICommand/configureAICommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/configureAICommand/AiSettingsPanel/constructor
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/configureAICommand/AiSettingsPanel/handle
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async redetect(): Promise<void>`

# Calls

- [buildLLMConfig](../../../../../functions/src/llm/llmConfig/buildLLMConfig.md)

# Called by

- [configureAICommand](../../../../../functions/src/commands/configureAICommand/configureAICommand.md)
- [constructor](../../../../../functions/src/commands/configureAICommand/AiSettingsPanel/constructor.md)
- [handle](../../../../../functions/src/commands/configureAICommand/AiSettingsPanel/handle.md)