---
type: TypeScript Function
title: registerMoveTopicFeature
resource: src/extension.ts#L576-L640
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/languageClient/getLanguageClient
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/constants/isDitaContentUri
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/logger/Logger/warn
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

`function registerMoveTopicFeature(context: vscode.ExtensionContext): void`

# Calls

- [getLanguageClient](../../../functions/src/languageClient/getLanguageClient.md)
- [isDitaContentUri](../../../functions/src/utils/constants/isDitaContentUri.md)
- [warn](../../../functions/src/utils/logger/Logger/warn.md)
- [info](../../../functions/src/utils/logger/Logger/info.md)

# Called by

- [activate](../../../functions/src/extension/activate.md)