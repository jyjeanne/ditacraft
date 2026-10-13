---
type: TypeScript Function
title: showAiDisabledMessage
resource: src/llm/aiEnabled.ts#L21-L26
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/commands/restructureMapCommand/restructureMapCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/aiQuickFixProvider/executeAiQuickFix
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function showAiDisabledMessage(): Promise<void>`

# Called by

- [restructureMapCommand](../../../../functions/src/commands/restructureMapCommand/restructureMapCommand.md)
- [executeAiQuickFix](../../../../functions/src/providers/aiQuickFixProvider/executeAiQuickFix.md)