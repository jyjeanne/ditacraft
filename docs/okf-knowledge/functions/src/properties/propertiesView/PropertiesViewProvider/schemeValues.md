---
type: TypeScript Method
title: schemeValues
resource: src/properties/propertiesView.ts#L307-L328
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/languageClient/getLanguageClient
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/properties/propertiesView/PropertiesViewProvider/refresh
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private async schemeValues(document: vscode.TextDocument): Promise<Record<string, string[]>>`

# Calls

- [getLanguageClient](../../../../../functions/src/languageClient/getLanguageClient.md)

# Called by

- [refresh](../../../../../functions/src/properties/propertiesView/PropertiesViewProvider/refresh.md)