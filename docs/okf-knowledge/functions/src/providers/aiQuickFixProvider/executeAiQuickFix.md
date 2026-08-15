---
type: TypeScript Function
title: executeAiQuickFix
resource: src/providers/aiQuickFixProvider.ts#L70-L130
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
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

- [fixFragment](../../../../functions/src/llm/aiServiceOrchestrator/AIServiceOrchestrator/fixFragment.md)

# Called by

- [safeExecuteAiQuickFix](../../../../functions/src/providers/aiQuickFixProvider/safeExecuteAiQuickFix.md)