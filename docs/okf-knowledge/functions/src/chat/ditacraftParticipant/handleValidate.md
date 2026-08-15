---
type: TypeScript Function
title: handleValidate
resource: src/chat/ditacraftParticipant.ts#L132-L181
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/llm/aiServiceOrchestrator/AIServiceOrchestrator/explainDiagnostic
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/errorUtils/getErrorMessage
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/chat/ditacraftParticipant/handleRequest
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function handleValidate( request: vscode.ChatRequest, response: vscode.ChatResponseStream, token: vscode.CancellationToken, orchestrator: AIServiceOrchestrator ): Promise<void>`

# Calls

- [explainDiagnostic](../../../../functions/src/llm/aiServiceOrchestrator/AIServiceOrchestrator/explainDiagnostic.md)
- [getErrorMessage](../../../../functions/src/utils/errorUtils/getErrorMessage.md)

# Called by

- [handleRequest](../../../../functions/src/chat/ditacraftParticipant/handleRequest.md)