---
type: TypeScript Function
title: safeExecuteAiQuickFix
resource: src/providers/aiQuickFixProvider.ts#L165-L173
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/providers/aiQuickFixProvider/executeAiQuickFix
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/errorUtils/getErrorMessage
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/extension/activate
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function safeExecuteAiQuickFix( orchestrator: AIServiceOrchestrator, documentUri: vscode.Uri, diagnostic: vscode.Diagnostic ): void`

# Calls

- [executeAiQuickFix](../../../../functions/src/providers/aiQuickFixProvider/executeAiQuickFix.md)
- [getErrorMessage](../../../../functions/src/utils/errorUtils/getErrorMessage.md)

# Called by

- [activate](../../../../functions/src/extension/activate.md)