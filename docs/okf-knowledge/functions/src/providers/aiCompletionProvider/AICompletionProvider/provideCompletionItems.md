---
type: TypeScript Method
title: provideCompletionItems
resource: src/providers/aiCompletionProvider.ts#L23-L47
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/configurationManager/ConfigurationManager/getConfiguration
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
- [_fetchWithTimeout](../../../../../functions/src/providers/aiCompletionProvider/AICompletionProvider/_fetchWithTimeout.md)