---
type: TypeScript Function
title: createDitacraftParticipant
resource: src/chat/ditacraftParticipant.ts#L33-L45
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/chat/ditacraftParticipant/handleRequest
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/extension/activate
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function createDitacraftParticipant( context: vscode.ExtensionContext, orchestrator: AIServiceOrchestrator ): vscode.ChatParticipant`

# Calls

- [handleRequest](../../../../functions/src/chat/ditacraftParticipant/handleRequest.md)

# Called by

- [activate](../../../../functions/src/extension/activate.md)