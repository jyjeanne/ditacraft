---
type: TypeScript Method
title: externalCatalog
resource: src/preview/visualPreviewPanel.ts#L642-L651
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/utils/configurationManager/ConfigurationManager/getConfiguration
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/fileCreationCommands/getWorkspaceFolder
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private externalCatalog(document: vscode.TextDocument): string | undefined`

# Calls

- [getConfiguration](../../../../../functions/src/utils/configurationManager/ConfigurationManager/getConfiguration.md)
- [getWorkspaceFolder](../../../../../functions/src/commands/fileCreationCommands/getWorkspaceFolder.md)