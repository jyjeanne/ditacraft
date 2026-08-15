---
type: TypeScript Method
title: explainElement
resource: src/llm/aiServiceOrchestrator.ts#L276-L311
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/llm/aiServiceOrchestrator/AIServiceOrchestrator/buildSnapshot
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/llm/aiServiceOrchestrator/tokenToSignal
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/chat/ditacraftParticipant/handleExplain
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async explainElement( elementXml: string, mapUri: string, onChunk: (chunk: string) => void, token?: vscode.CancellationToken, userContext?: string ): Promise<void>`

# Calls

- [buildSnapshot](../../../../../functions/src/llm/aiServiceOrchestrator/AIServiceOrchestrator/buildSnapshot.md)
- [tokenToSignal](../../../../../functions/src/llm/aiServiceOrchestrator/tokenToSignal.md)

# Called by

- [handleExplain](../../../../../functions/src/chat/ditacraftParticipant/handleExplain.md)