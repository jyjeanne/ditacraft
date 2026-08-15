---
type: TypeScript Method
title: suggestReuse
resource: src/llm/aiServiceOrchestrator.ts#L317-L346
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
  - target: functions/src/chat/ditacraftParticipant/handleSuggestReuse
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async suggestReuse( mapUri: string, onChunk: (chunk: string) => void, token?: vscode.CancellationToken ): Promise<void>`

# Calls

- [buildSnapshot](../../../../../functions/src/llm/aiServiceOrchestrator/AIServiceOrchestrator/buildSnapshot.md)
- [tokenToSignal](../../../../../functions/src/llm/aiServiceOrchestrator/tokenToSignal.md)

# Called by

- [handleSuggestReuse](../../../../../functions/src/chat/ditacraftParticipant/handleSuggestReuse.md)