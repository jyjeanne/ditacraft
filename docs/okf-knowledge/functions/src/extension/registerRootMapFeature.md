---
type: TypeScript Function
title: registerRootMapFeature
resource: src/extension.ts#L311-L430
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/extension/updateRootMapStatusBar
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/configurationManager/ConfigurationManager/getConfiguration
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/languageClient/getLanguageClient
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/logger/Logger/info
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/extension/activate
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function registerRootMapFeature(context: vscode.ExtensionContext): void`

# Calls

- [updateRootMapStatusBar](../../../functions/src/extension/updateRootMapStatusBar.md)
- [getConfiguration](../../../functions/src/utils/configurationManager/ConfigurationManager/getConfiguration.md)
- [getLanguageClient](../../../functions/src/languageClient/getLanguageClient.md)
- [info](../../../functions/src/utils/logger/Logger/info.md)

# Called by

- [activate](../../../functions/src/extension/activate.md)