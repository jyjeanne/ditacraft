---
type: TypeScript Function
title: startLanguageClient
resource: src/languageClient.ts#L17-L64
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/utils/configurationManager/ConfigurationManager/getConfiguration
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/start
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/extension/activate
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function startLanguageClient( context: vscode.ExtensionContext ): Promise<void>`

# Calls

- [getConfiguration](../../../functions/src/utils/configurationManager/ConfigurationManager/getConfiguration.md)
- [start](../../../functions/webview/editor/start.md)

# Called by

- [activate](../../../functions/src/extension/activate.md)