---
type: TypeScript Method
title: streamRaw
resource: src/llm/aiServiceOrchestrator.ts#L352-L369
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/llm/aiServiceOrchestrator/tokenToSignal
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/providers/aiCompletionProvider/AICompletionProvider/_getAiCompletions
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async streamRaw( userMessage: string, onChunk: (chunk: string) => void, token?: vscode.CancellationToken ): Promise<void>`

# Calls

- [tokenToSignal](../../../../../functions/src/llm/aiServiceOrchestrator/tokenToSignal.md)

# Called by

- [_getAiCompletions](../../../../../functions/src/providers/aiCompletionProvider/AICompletionProvider/_getAiCompletions.md)