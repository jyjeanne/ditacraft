---
type: TypeScript Method
title: explainDiagnostic
resource: src/llm/aiServiceOrchestrator.ts#L182-L211
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/llm/aiServiceOrchestrator/tokenToSignal
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/chat/ditacraftParticipant/handleValidate
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async explainDiagnostic( fragment: string, diagnostic: vscode.Diagnostic, _contextUri: string, onChunk: (chunk: string) => void, token?: vscode.CancellationToken ): Promise<void>`

# Calls

- [tokenToSignal](../../../../../functions/src/llm/aiServiceOrchestrator/tokenToSignal.md)

# Called by

- [handleValidate](../../../../../functions/src/chat/ditacraftParticipant/handleValidate.md)