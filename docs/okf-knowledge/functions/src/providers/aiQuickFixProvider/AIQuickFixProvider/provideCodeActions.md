---
type: TypeScript Method
title: provideCodeActions
resource: src/providers/aiQuickFixProvider.ts#L47-L61
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/configurationManager/ConfigurationManager/getConfiguration
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/aiQuickFixProvider/isAiFixable
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/aiQuickFixProvider/buildAction
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`provideCodeActions( document: vscode.TextDocument, _range: vscode.Range | vscode.Selection, context: vscode.CodeActionContext, _token: vscode.CancellationToken ): vscode.CodeAction[] | undefined`

# Calls

- [getConfiguration](../../../../../functions/src/utils/configurationManager/ConfigurationManager/getConfiguration.md)
- [isAiFixable](../../../../../functions/src/providers/aiQuickFixProvider/isAiFixable.md)
- [buildAction](../../../../../functions/src/providers/aiQuickFixProvider/buildAction.md)