---
type: TypeScript Function
title: buildSettingsHtml
resource: src/commands/configureAICommand.ts#L80-L169
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/commands/configureAICommand/escapeHtml
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/commands/configureAICommand/configureAICommand
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function buildSettingsHtml( providers: Array<{ id: string; name: string; available: boolean }>, activeId: string | null ): string`

# Calls

- [escapeHtml](../../../../functions/src/commands/configureAICommand/escapeHtml.md)

# Called by

- [configureAICommand](../../../../functions/src/commands/configureAICommand/configureAICommand.md)