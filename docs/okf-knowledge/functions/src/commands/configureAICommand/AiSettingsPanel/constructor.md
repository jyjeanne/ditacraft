---
type: TypeScript Method
title: constructor
resource: src/commands/configureAICommand.ts#L159-L188
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/commands/configureAICommand/buildSettingsHtml
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/configureAICommand/AiSettingsPanel/redetect
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`constructor(private readonly router: LLMRouterService, private readonly secrets: SecretManager)`

# Calls

- [buildSettingsHtml](../../../../../functions/src/commands/configureAICommand/buildSettingsHtml.md)
- [redetect](../../../../../functions/src/commands/configureAICommand/AiSettingsPanel/redetect.md)