---
type: TypeScript Function
title: registerMoveTopicFeature
resource: src/extension.ts#L622-L697
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/languageClient/getLanguageClient
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/grammarRegistry/GrammarRegistry/entries
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/logger/Logger/warn
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/RowDrag/find
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
- [entries](../../../functions/src/preview/grammarRegistry/GrammarRegistry/entries.md)
- [warn](../../../functions/src/utils/logger/Logger/warn.md)
- [find](../../../functions/webview/editor/mapView/RowDrag/find.md)

# Called by

- [activate](../../../functions/src/extension/activate.md)