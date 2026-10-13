---
type: TypeScript Method
title: provideCompletionItems
resource: src/providers/aiCompletionProvider.ts#L24-L48
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/utils/configurationManager/ConfigurationManager/getConfiguration
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/llm/aiEnabled/isAiEnabled
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/aiCompletionProvider/AICompletionProvider/_fetchWithTimeout
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async provideCompletionItems( document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, _context: vscode.CompletionContext ): Promise<vscode.CompletionList | null>`

# Calls

- [getConfiguration](../../../../../functions/src/utils/configurationManager/ConfigurationManager/getConfiguration.md)
- [isAiEnabled](../../../../../functions/src/llm/aiEnabled/isAiEnabled.md)
- [_fetchWithTimeout](../../../../../functions/src/providers/aiCompletionProvider/AICompletionProvider/_fetchWithTimeout.md)