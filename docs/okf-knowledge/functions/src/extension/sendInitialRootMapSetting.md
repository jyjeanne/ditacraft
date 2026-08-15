---
type: TypeScript Function
title: sendInitialRootMapSetting
resource: src/extension.ts#L450-L469
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/configurationManager/ConfigurationManager/getConfiguration
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/configurationManager/ConfigurationManager/get
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/languageClient/getLanguageClient
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/extension/updateRootMapStatusBar
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/extension/activate
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function sendInitialRootMapSetting(): void`

# Calls

- [getConfiguration](../../../functions/src/utils/configurationManager/ConfigurationManager/getConfiguration.md)
- [get](../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)
- [getLanguageClient](../../../functions/src/languageClient/getLanguageClient.md)
- [updateRootMapStatusBar](../../../functions/src/extension/updateRootMapStatusBar.md)

# Called by

- [activate](../../../functions/src/extension/activate.md)