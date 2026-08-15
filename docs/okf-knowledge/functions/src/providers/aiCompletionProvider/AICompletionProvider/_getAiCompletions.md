---
type: TypeScript Method
title: _getAiCompletions
resource: src/providers/aiCompletionProvider.ts#L78-L129
visibility: private
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/providers/aiCompletionProvider/AICompletionProvider/_insertCursor
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/llm/aiServiceOrchestrator/AIServiceOrchestrator/streamRaw
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/providers/aiCompletionProvider/AICompletionProvider/_fetchWithTimeout
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private async _getAiCompletions( document: vscode.TextDocument, position: vscode.Position, vsToken: vscode.CancellationToken ): Promise<vscode.CompletionItem[]>`

# Calls

- [_insertCursor](../../../../../functions/src/providers/aiCompletionProvider/AICompletionProvider/_insertCursor.md)
- [streamRaw](../../../../../functions/src/llm/aiServiceOrchestrator/AIServiceOrchestrator/streamRaw.md)

# Called by

- [_fetchWithTimeout](../../../../../functions/src/providers/aiCompletionProvider/AICompletionProvider/_fetchWithTimeout.md)