---
type: TypeScript Function
title: configureAICommand
resource: src/commands/configureAICommand.ts#L129-L139
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/commands/configureAICommand/AiSettingsPanel/redetect
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/extension/activate
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function configureAICommand(router: LLMRouterService, secretManager: SecretManager): Promise<void>`

# Calls

- [redetect](../../../../functions/src/commands/configureAICommand/AiSettingsPanel/redetect.md)

# Called by

- [activate](../../../../functions/src/extension/activate.md)