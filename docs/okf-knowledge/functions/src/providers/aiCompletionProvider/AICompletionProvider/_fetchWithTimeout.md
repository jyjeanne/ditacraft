---
type: TypeScript Method
title: _fetchWithTimeout
resource: src/providers/aiCompletionProvider.ts#L49-L76
visibility: private
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/providers/aiCompletionProvider/AICompletionProvider/_getAiCompletions
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/providers/aiCompletionProvider/AICompletionProvider/provideCompletionItems
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private _fetchWithTimeout( document: vscode.TextDocument, position: vscode.Position, vsToken: vscode.CancellationToken ): Promise<vscode.CompletionItem[]>`

# Calls

- [_getAiCompletions](../../../../../functions/src/providers/aiCompletionProvider/AICompletionProvider/_getAiCompletions.md)

# Called by

- [provideCompletionItems](../../../../../functions/src/providers/aiCompletionProvider/AICompletionProvider/provideCompletionItems.md)