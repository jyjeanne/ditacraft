---
type: TypeScript Function
title: executeAiQuickFix
resource: src/providers/aiQuickFixProvider.ts#L81-L146
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/llm/aiEnabled/isAiEnabled
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/llm/aiEnabled/showAiDisabledMessage
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/llm/aiServiceOrchestrator/AIServiceOrchestrator/fixFragment
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/providers/aiQuickFixProvider/safeExecuteAiQuickFix
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function executeAiQuickFix( orchestrator: AIServiceOrchestrator, documentUri: vscode.Uri, diagnostic: vscode.Diagnostic ): Promise<void>`

# Calls

- [isAiEnabled](../../../../functions/src/llm/aiEnabled/isAiEnabled.md)
- [showAiDisabledMessage](../../../../functions/src/llm/aiEnabled/showAiDisabledMessage.md)
- [fixFragment](../../../../functions/src/llm/aiServiceOrchestrator/AIServiceOrchestrator/fixFragment.md)

# Called by

- [safeExecuteAiQuickFix](../../../../functions/src/providers/aiQuickFixProvider/safeExecuteAiQuickFix.md)