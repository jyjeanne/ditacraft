---
type: TypeScript Function
title: handleRequest
resource: src/chat/ditacraftParticipant.ts#L49-L77
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/chat/ditacraftParticipant/handleRestructure
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/chat/ditacraftParticipant/handleValidate
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/chat/ditacraftParticipant/handleExplain
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/chat/ditacraftParticipant/handleSuggestReuse
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/chat/ditacraftParticipant/createDitacraftParticipant
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function handleRequest( request: vscode.ChatRequest, response: vscode.ChatResponseStream, token: vscode.CancellationToken, orchestrator: AIServiceOrchestrator, _context: vscode.ExtensionContext ): Promise<void>`

# Calls

- [handleRestructure](../../../../functions/src/chat/ditacraftParticipant/handleRestructure.md)
- [handleValidate](../../../../functions/src/chat/ditacraftParticipant/handleValidate.md)
- [handleExplain](../../../../functions/src/chat/ditacraftParticipant/handleExplain.md)
- [handleSuggestReuse](../../../../functions/src/chat/ditacraftParticipant/handleSuggestReuse.md)

# Called by

- [createDitacraftParticipant](../../../../functions/src/chat/ditacraftParticipant/createDitacraftParticipant.md)