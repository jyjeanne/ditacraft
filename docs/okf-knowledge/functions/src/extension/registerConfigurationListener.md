---
type: TypeScript Function
title: registerConfigurationListener
resource: src/extension.ts#L1030-L1044
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/configurationManager/ConfigurationManager/setErrorHandler
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/configurationManager/ConfigurationManager/onConfigurationChange
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/extension/activate
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function registerConfigurationListener(context: vscode.ExtensionContext): void`

# Calls

- [setErrorHandler](../../../functions/src/utils/configurationManager/ConfigurationManager/setErrorHandler.md)
- [onConfigurationChange](../../../functions/src/utils/configurationManager/ConfigurationManager/onConfigurationChange.md)

# Called by

- [activate](../../../functions/src/extension/activate.md)