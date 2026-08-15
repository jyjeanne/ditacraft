---
type: TypeScript Method
title: restructureMap
resource: src/llm/aiServiceOrchestrator.ts#L121-L176
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
  - target: functions/src/llm/aiServiceOrchestrator/extractXml
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/chat/ditacraftParticipant/handleRestructure
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/restructureMapCommand/restructureMapCommand
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async restructureMap( mapUri: string, intention: string, onChunk: (chunk: string) => void, token?: vscode.CancellationToken, maxContextTokens = 6000 ): Promise<RestructureResult>`

# Calls

- [buildSnapshot](../../../../../functions/src/llm/aiServiceOrchestrator/AIServiceOrchestrator/buildSnapshot.md)
- [tokenToSignal](../../../../../functions/src/llm/aiServiceOrchestrator/tokenToSignal.md)
- [extractXml](../../../../../functions/src/llm/aiServiceOrchestrator/extractXml.md)

# Called by

- [handleRestructure](../../../../../functions/src/chat/ditacraftParticipant/handleRestructure.md)
- [restructureMapCommand](../../../../../functions/src/commands/restructureMapCommand/restructureMapCommand.md)